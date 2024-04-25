import { Image } from "image-js";
// ***default ascii Set "WM@QBGNROD&SE$Hm8Kg6ZU9%CwXAP0qpb3d52#VFaeh4koyYsTunzxJcL7>]<[?v{=}f1+j)(tIl^r|!i/~\"*;_-:',`. ";
const COLOR_SET = "WM@QBGNROD&SEHm8TunzxJ><?=f1+t^r|/~\";_-:',`. ";

type ResultType = {
    resultString: string;
    originImageWidth: number;
    originImageHeight: number;
    lineHeight: number;
    lineWidth: number;
    convertColorArray: Uint8Array | undefined;
};

const generateAA = async (
    file: string | ArrayBuffer | Uint8Array,
    maxWidth: number,
    withColor?: boolean
): Promise<ResultType> => {
    if (maxWidth <= 0) {
        throw new Error("invalid maxWidth parameter.");
    }
    let resultString = "";
    const sharpStream = await Image.load(file);
    const colorset = COLOR_SET;
    const pixelToChar = (num: number) => {
        return colorset[Math.floor((num / 255) * colorset.length) - 1] ?? colorset[0];
    };

    const { width, height } = { width: sharpStream.width, height: sharpStream.height };
    const scale = maxWidth / width;
    const convertColorArray = [];
    const resize = sharpStream.resize({ factor: scale });
    const colorArray = withColor ? resize.getRGBAData() : [];
    const gray = resize.grey({ mergeAlpha: true });
    const rawData = gray.getRGBAData();
    const pixelArray = [];
    let lineHeight = 0;

    if (withColor) {
        const colorWidth = gray.width;
        const colorHeight = gray.height;
        for (let height = 0; height < colorHeight; height += 2) {
            for (let width = 0; width < colorWidth; width++) {
                const r1 = colorArray[width * 4 + height * colorWidth * 4];
                const g1 = colorArray[width * 4 + height * colorWidth * 4 + 1];
                const b1 = colorArray[width * 4 + height * colorWidth * 4 + 2];

                const r2 = colorArray[width * 4 + (height + 1) * colorWidth * 4];
                const g2 = colorArray[width * 4 + (height + 1) * colorWidth * 4 + 1];
                const b2 = colorArray[width * 4 + (height + 1) * colorWidth * 4 + 2];
                convertColorArray.push(Math.floor((r1 + r2) / 2));
                convertColorArray.push(Math.floor((g1 + g2) / 2));
                convertColorArray.push(Math.floor((b1 + b2) / 2));
            }
        }
    }

    // グレーは1チャンネルの値のみあれば十分
    for (let i = 0; i < rawData.length; i += 4) {
        pixelArray.push(rawData[i]);
    }
    for (let i = 0; i < Math.floor(gray.height / 2); i++) {
        for (let j = 0; j < gray.width; j++) {
            const a1 = pixelArray[j + 2 * i * gray.width];
            const a2 = pixelArray[j + (2 * i + 1) * gray.width];
            resultString += a2 ? pixelToChar((a1 + a2) / 2) : pixelToChar(a1);
        }
        lineHeight += 1;
        resultString += "\n";
    }
    return {
        resultString,
        originImageWidth: width,
        originImageHeight: height,
        lineHeight,
        lineWidth: gray.width,
        convertColorArray: withColor ? Uint8Array.from(convertColorArray) : undefined,
    };
};

export default generateAA;
