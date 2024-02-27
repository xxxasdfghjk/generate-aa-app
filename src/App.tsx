import { ChangeEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import generateAA from "generate-aa";
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Slider,
    TextField,
    Tooltip,
    Typography,
    styled,
} from "@mui/material";
import { Image } from "image-js";
import copy from "clipboard-copy";
import { Assignment } from "@mui/icons-material";
const padding = 10;
const DEFAULT_MAX_LENGTH = 400;
const FONT_SIZE = 18;
const MAX_SCREEN_WIDTH = 920;
const WIDTH_RATIO = 0.95;
const range = (offset: number, num: number) => {
    return new Array(num).fill(0).map((_e, i) => i + offset);
};
const uniq = (array: number[]): number[] => {
    const map = new Map(array.map((e) => [e, e]));
    return Array.from(map.keys()).sort((a, b) => b - a);
};

function App() {
    const ref = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaWrapperRef = useRef<HTMLDivElement>(null);

    const [textareaWidth, setTextareaWidth] = useState<number>(640);
    const [textareaHeight, setTextareaHeight] = useState<number>(800);
    const [maxLength, setMaxLength] = useState<number>(DEFAULT_MAX_LENGTH);
    const [maxSlider, setMaxSlider] = useState<number>(100);
    const [textWidth, setTextWidth] = useState<number>(100);
    const [textHeight, setTextHeight] = useState<number>(100);
    const [percent, setPercent] = useState<number>(0.6);
    const [aaText, setaaText] = useState<string>("");
    const [openTip, setOpenTip] = useState<boolean>(false);
    const [marks, setMarks] = useState<{ value: number; label: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
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
        const handler = () => {
            const textareaWrapperWidth = Math.min(document.documentElement.clientWidth, MAX_SCREEN_WIDTH);
            setPercent((WIDTH_RATIO * textareaWrapperWidth) / textareaWidth);
        };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [textareaWidth]);

    useEffect(() => {
        const func = async () => {
            try {
                if (file) {
                    setIsProcessing(true);
                    const imageWidth = (await Image.load(await file.arrayBuffer())).width;
                    const marks = uniq(
                        range(1, imageWidth).map((width) => Math.floor(imageWidth / Math.floor(imageWidth / width)))
                    ).map((e) => ({
                        value: Math.floor(imageWidth / Math.floor(e)),
                        label: `${Math.floor(imageWidth / Math.floor(e))}`,
                    }));
                    const res = await generateAA(await file.arrayBuffer(), maxLength);
                    if (ref.current?.querySelector("input")?.value)
                        ref.current!.querySelector("input")!.value! = String(maxLength);
                    const lines = res.split("\n");
                    const newTextareaWidth = (lines[0].length * FONT_SIZE) / (2 - 0.1);
                    const textareaWrapperWidth = Math.min(document.documentElement.clientWidth, MAX_SCREEN_WIDTH);
                    setTextareaWidth(newTextareaWidth);
                    setTextHeight(lines.length);
                    setTextWidth(lines[0].length);
                    setTextareaHeight(Math.ceil(lines.length * FONT_SIZE) * 1.05);
                    setPercent((WIDTH_RATIO * textareaWrapperWidth) / newTextareaWidth);
                    setaaText(res);
                    setMarks(marks);
                    setMaxSlider(imageWidth);
                    setIsProcessing(false);
                }
            } catch {
                setIsProcessing(false);
            }
        };
        func();
    }, [file, maxLength]);

    return (
        <>
            <div>
                <input ref={inputRef} type="file" accept="image/*" onChange={onChange} hidden />
            </div>
            <SButtonWrapper width={"90%"}>
                <SButton onClick={() => inputRef.current?.click()} variant="contained">
                    画像をアップロード
                </SButton>
            </SButtonWrapper>
            <SForms
                onSubmit={(e) => {
                    e.preventDefault();
                    const value = ref.current?.querySelector("input")?.value;
                    if (value === undefined || value === "") {
                        return;
                    }
                    if (parseInt(value, 10) <= 0) {
                        return;
                    }
                    const ableValue = marks.filter((e) => e.value <= parseInt(value ?? "1", 10)).at(-1);
                    setMaxLength(ableValue?.value ?? 1);
                    if (value) setMaxLength(parseInt(value, 10));
                }}
            >
                <STextField
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
                <SContainer>
                    <Slider
                        valueLabelDisplay="auto"
                        step={1}
                        onChangeCommitted={(_e, value) => {
                            setMaxLength(value as number);
                        }}
                        max={maxSlider}
                        min={1}
                        sx={{ width: "80%" }}
                        marks={marks.filter((_, i) => i > Math.max(marks.length - 5, 0))}
                    />
                    {isProcessing && (
                        <Box sx={{ position: "relative", display: "inline-flex" }}>
                            <CircularProgress />
                            <Box
                                sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: "absolute",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="caption" component="div" color="text.secondary">
                                    {"処理中"}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    <SIconWrapper>
                        <Tooltip
                            arrow
                            open={openTip}
                            onClose={handleCloseTip}
                            placement="top"
                            title="Copied!"
                            leaveDelay={2000}
                        >
                            <IconButton disabled={aaText === ""} onClick={handleClickButton} size={"large"}>
                                <Assignment />
                            </IconButton>
                        </Tooltip>
                    </SIconWrapper>
                </SContainer>
            )}
            <STextareaWrapper ref={textareaWrapperRef}>
                <STextarea
                    padding={padding}
                    textareaWidth={textareaWidth}
                    textareaHeight={textareaHeight}
                    percent={percent}
                >
                    {aaText}
                </STextarea>
            </STextareaWrapper>
        </>
    );
}

const SContainer = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 40px",
});
const STextField = styled(TextField)({
    width: "50%",
});
const STextarea = styled("div")(
    ({
        textareaWidth,
        padding,
        textareaHeight,
        percent,
    }: {
        padding: number;
        textareaWidth: number;
        textareaHeight: number;
        percent: number;
    }) => ({
        fontSize: `${FONT_SIZE}px`,
        letterSpacing: "0",
        width: textareaWidth,
        height: textareaHeight,
        padding,
        fontFamily: '"Osaka-等幅", "Osaka-Mono", "ＭＳ ゴシック", "MS Gothic", monospace !important;',
        ":focus": {
            outline: "none",
        },
        overflowX: "hidden",
        overflowY: "hidden",
        textAlign: "center",
        resize: "none",
        // スマホのブラウザではline-heightの小数点以下が切り捨てられているため
        // line-height
        "&&&": { lineHeight: "1" },
        background: "#fff",
        whiteSpace: "pre",
        display: "block",
        transform: `scale(${percent}) translate(-50%,0)`,
        top: 0,
        left: "50%",
        position: "absolute",
        transformOrigin: "top left" /* 拡大/縮小の基準点を左上に設定 */,
    })
);
const SForms = styled("form")({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    "> *": {
        margin: "2px 5px",
    },
    input: {
        width: "100%",
    },
    padding: "20px",
    width: "90%",
    margin: "0 auto",
});
const SButton = styled(Button)({
    width: "100%",
    height: "100px",
});
const SButtonWrapper = styled("div")(({ width }: { width: string }) => ({
    padding: "20px",
    margin: "0 auto",
    width,
}));
const SSubmitButton = styled(Button)({
    width: "100%",
    height: "60px",
});

const SSubmitButtonWrapper = styled("div")({
    width: "30%",
    padding: "20px;",
});
const STextareaWrapper = styled("div")({
    position: "relative",
    width: "100%",
});

const SIconWrapper = styled("div")({});
export default App;
