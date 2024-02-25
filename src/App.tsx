import { ChangeEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import generateAA from "generate-aa";
import { Button, IconButton, Slider, TextField, Tooltip, styled } from "@mui/material";
import { Image } from "image-js";
import copy from "clipboard-copy";
import { Assignment } from "@mui/icons-material";
const padding = 10;
const DEFAULT_MAX_LENGTH = 400;
const range = (offset: number, num: number) => {
    return new Array(num).fill(0).map((e, i) => i + offset);
};
const uniq = (array: number[]): number[] => {
    const map = new Map(array.map((e) => [e, e]));
    return Array.from(map.keys()).sort((a, b) => b - a);
};
function App() {
    const ref = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [fontSize, setFontSize] = useState<number>(1);
    const [textareaWidth, setTextareaWidth] = useState<number>(640);
    const [textareaHeight, setTextareaHeight] = useState<number>(800);
    const [maxLength, setMaxLength] = useState<number>(DEFAULT_MAX_LENGTH);
    const [maxSlider, setMaxSlider] = useState<number>(100);
    const [textWidth, setTextWidth] = useState<number>(100);
    const [textHeight, setTextHeight] = useState<number>(100);
    const [fileImageWidth, setFileImageWidth] = useState<number>(100);
    const [aaText, setaaText] = useState<string>("");
    const [openTip, setOpenTip] = useState<boolean>(false);
    const [marks, setMarks] = useState<{ value: number; label: string }[]>([]);

    const [file, setFile] = useState<File>();
    const handleCloseTip = (): void => {
        setOpenTip(false);
    };

    const handleClickButton = async () => {
        copy(aaText).then(() => setOpenTip(true));
    };
    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e?.target?.files?.[0]);
    };
    useEffect(() => {
        const func = async () => {
            if (file) {
                const imageWidth = (await Image.load(await file.arrayBuffer())).width;
                setFileImageWidth(imageWidth);
                const marks = uniq(
                    range(1, imageWidth).map((width) => Math.floor(imageWidth / Math.floor(imageWidth / width)))
                ).map((e) => ({
                    value: Math.floor(imageWidth / Math.floor(e)),
                    label: `${Math.floor(imageWidth / Math.floor(e))}`,
                }));
                setMarks(marks);
                setMaxSlider(imageWidth);
                const res = await generateAA(await file.arrayBuffer(), maxLength);
                if (ref.current?.querySelector("input")?.value)
                    ref.current!.querySelector("input")!.value! = String(maxLength);
                setaaText(res);
                const lines = res.split("\n");
                const width = textareaWidth;
                setTextHeight(lines.length);
                setTextWidth(lines[0].length);
                setFontSize(((width - 2 * padding) / lines[0].length) * 2.0);
                setTextareaHeight(Math.ceil(lines.length * 0.95 * (width / lines[0].length) * 2.0) + padding);
            }
        };
        func();
    }, [file, maxLength]);

    return (
        <>
            <div>
                <input ref={inputRef} type="file" accept="image/*" onChange={onChange} hidden />
            </div>
            <SButtonWrapper>
                <SButton onClick={() => inputRef.current?.click()} variant="contained">
                    画像をアップロード
                </SButton>
            </SButtonWrapper>
            <SForms
                onSubmit={(e) => {
                    e.preventDefault();
                    const value = ref.current?.querySelector("input")?.value;
                    const ableValue = marks.filter((e) => e.value <= parseInt(value ?? "1", 10)).at(-1);
                    setMaxLength(ableValue?.value ?? 1);
                    if (value) setMaxLength(parseInt(value, 10));
                }}
            >
                <TextField
                    label={"1行の最大文字数（スライダーでも変更可能）"}
                    type={"number"}
                    ref={ref}
                    inputProps={{ pattern: "^[0-9]+$" }}
                    disabled={file === undefined}
                />
                <SSubmitButtonWrapper>
                    <SSubmitButton type="submit" disabled={file === undefined} variant={"outlined"}>
                        反映
                    </SSubmitButton>
                </SSubmitButtonWrapper>
            </SForms>
            {file && <div>{`1行あたりの文字数 : ${textWidth}  行数: ${textHeight}`}</div>}
            {file && (
                <>
                    <Slider
                        value={maxLength}
                        valueLabelDisplay="auto"
                        step={1}
                        marks={marks.filter((e) => e.value >= fileImageWidth / 6)}
                        onChange={(_e, value) => {
                            const discrete = marks
                                .sort(
                                    (a, b) =>
                                        Math.abs(a.value - (value as number)) - Math.abs(b.value - (value as number))
                                )

                                .at(0)?.value;
                            setMaxLength(discrete ?? 1);
                        }}
                        max={maxSlider}
                        min={1}
                        sx={{ width: "90%" }}
                    />
                </>
            )}
            <STextareaWrapper>
                <SIconWrapper>
                    <Tooltip
                        arrow
                        open={openTip}
                        onClose={handleCloseTip}
                        placement="top"
                        title="Copied!"
                        leaveDelay={2000}
                    >
                        <IconButton disabled={aaText === ""} onClick={handleClickButton}>
                            <Assignment />
                        </IconButton>
                    </Tooltip>
                </SIconWrapper>
                <STextarea
                    padding={padding}
                    textareaWidth={textareaWidth}
                    textareaHeight={textareaHeight}
                    fontSize={fontSize}
                    disabled={true}
                    spellCheck="false"
                    ref={textareaRef}
                    value={aaText}
                ></STextarea>
            </STextareaWrapper>
        </>
    );
}

const STextarea = styled("textarea")(
    ({
        fontSize,
        textareaWidth,
        padding,
        textareaHeight,
    }: {
        padding: number;
        fontSize: number;
        textareaWidth: number;
        textareaHeight: number;
    }) => ({
        fontSize,
        width: textareaWidth,
        height: textareaHeight,
        padding,
        fontFamily: '"Osaka-等幅", "Osaka-Mono", "ＭＳ ゴシック", "MS Gothic", monospace !important;',
        ":focus": {
            outline: "none",
        },
        overflowX: "scroll",
        overflowY: "hidden",
        textAlign: "center",
        resize: "none",
        lineHeight: "0.9",
        background: "#fff",
    })
);
const SForms = styled("form")({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    "> *": {
        margin: "2px 5px",
    },
    input: {
        width: "360px",
    },
});
const SButton = styled(Button)({
    width: "100%",
    height: "100px",
});
const SButtonWrapper = styled("div")({
    padding: "20px;",
    margin: "0 auto",
    width: "640px",
});
const SSubmitButton = styled(Button)({
    width: "160px",
    height: "60px",
});

const SSubmitButtonWrapper = styled("div")({
    padding: "20px;",
});
const STextareaWrapper = styled("div")({
    position: "relative",
    width: "fit-content",
    margin: "0 auto",
    marginTop: "20px",
});

const SIconWrapper = styled("div")({
    position: "absolute",
    top: "3px",
    right: "-50px",
});
export default App;
