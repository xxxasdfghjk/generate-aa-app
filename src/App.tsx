import { ChangeEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import generateAA from "./lib/generateAA";
import {
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    IconButton,
    Slider,
    Switch,
    TextField,
    Tooltip,
    Typography,
    styled,
} from "@mui/material";
import copy from "clipboard-copy";
import { Assignment } from "@mui/icons-material";
const padding = 10;
const FONT_SIZE = 18;
const MAX_SCREEN_WIDTH = 920;
const WIDTH_RATIO = 0.95;

type CanvasState = {
    textareaWidth: number;
    textareaHeight: number;
    textHeight: number;
    textWidth: number;
    percent: number;
    aaText: string;
    marks: { value: number; label: string }[];
    maxSlider: number;
    isProcessing: boolean;
    withColor: boolean;
    maxLength: number;
};

function App() {
    const ref = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaWrapperRef = useRef<HTMLDivElement>(null);

    const [canvasState, setCanvasState] = useState<CanvasState>({
        textareaWidth: 640,
        textareaHeight: 800,
        textHeight: 100,
        textWidth: 100,
        percent: 0.6,
        aaText: "",
        marks: [],
        maxSlider: 100,
        isProcessing: false,
        withColor: false,
        maxLength: 400,
    });

    const [openTip, setOpenTip] = useState<boolean>(false);
    const [colorArray, setColorArray] = useState<Uint8Array | Uint8ClampedArray | undefined>(new Uint8Array());

    const [file, setFile] = useState<File>();
    const handleCloseTip = (): void => {
        setOpenTip(false);
    };

    const handleClickButton = async () => {
        copy(canvasState.aaText).then(() => setOpenTip(true));
    };
    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e?.target?.files?.[0]);
    };

    useEffect(() => {
        const handler = () => {
            const textareaWrapperWidth = Math.min(document.documentElement.clientWidth, MAX_SCREEN_WIDTH);
            setCanvasState((prev) => ({
                ...prev,
                precent: (WIDTH_RATIO * textareaWrapperWidth) / canvasState.textareaWidth,
            }));
        };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [canvasState.textareaWidth]);

    useEffect(() => {
        const func = async () => {
            try {
                if (file) {
                    setCanvasState((prev) => ({ ...prev, isProcessing: true }));
                    const {
                        resultString,
                        originImageWidth: imageWidth,
                        lineHeight,
                        lineWidth,
                        convertColorArray,
                    } = await generateAA(await file.arrayBuffer(), canvasState.maxLength, canvasState.withColor);
                    if (ref.current?.querySelector("input")?.value)
                        ref.current!.querySelector("input")!.value! = String(canvasState.maxLength);
                    const newTextareaWidth = (lineWidth * FONT_SIZE) / (2 - 0.3);
                    const textareaWrapperWidth = Math.min(document.documentElement.clientWidth, MAX_SCREEN_WIDTH);
                    const marks = [
                        { value: 1, label: `1` },
                        { value: lineWidth, label: `${lineWidth}` },
                        { value: imageWidth, label: `${imageWidth}` },
                    ];
                    setCanvasState((prev) => ({
                        ...prev,
                        textareaWidth: newTextareaWidth,
                        textareaHeight: Math.ceil(lineHeight * FONT_SIZE) * 1.05,
                        textHeight: lineHeight,
                        textWidth: lineWidth,
                        percent: (WIDTH_RATIO * textareaWrapperWidth) / newTextareaWidth,
                        aaText: resultString,
                        marks,
                        maxSlider: imageWidth,
                        isProcessing: false,
                    }));
                    if (canvasState.withColor) {
                        setColorArray(convertColorArray ?? new Uint8Array());
                    }
                }
            } catch {
                setCanvasState((prev) => ({ ...prev, isProcessing: false }));
            }
        };
        func();
    }, [file, canvasState.maxLength, canvasState.withColor]);

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
            <FormControlLabel
                control={
                    <Switch
                        onChange={(_e, checked) => setCanvasState((prev) => ({ ...prev, withColor: checked }))}
                        value={canvasState.withColor}
                    ></Switch>
                }
                label="Color Mode"
            />
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
                    const ableValue = canvasState.marks.filter((e) => e.value <= parseInt(value ?? "1", 10)).at(-1);
                    setCanvasState((prev) => ({ ...prev, maxLength: ableValue?.value ?? 1 }));
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
            {file && <div>{`1行あたりの文字数 : ${canvasState.textWidth}  行数: ${canvasState.textHeight}`}</div>}
            {file && (
                <SContainer>
                    <Slider
                        valueLabelDisplay="auto"
                        step={1}
                        onChangeCommitted={(_e, value) => {
                            setCanvasState((prev) => ({ ...prev, maxLength: value as number }));
                        }}
                        max={canvasState.maxSlider}
                        min={1}
                        sx={{ width: "80%" }}
                        marks={canvasState.marks}
                    />
                    {canvasState.isProcessing && (
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
                            <IconButton disabled={canvasState.aaText === ""} onClick={handleClickButton} size={"large"}>
                                <Assignment />
                            </IconButton>
                        </Tooltip>
                    </SIconWrapper>
                </SContainer>
            )}
            <STextareaWrapper ref={textareaWrapperRef}>
                <STextarea
                    padding={padding}
                    textareaWidth={canvasState.textareaWidth}
                    textareaHeight={canvasState.textareaHeight}
                    percent={canvasState.percent}
                >
                    {canvasState.withColor && colorArray
                        ? canvasState.aaText.split("\n").map((e, height) => (
                              <>
                                  {e.split("").map((s, i) => {
                                      return (
                                          <span
                                              key={i}
                                              style={{
                                                  color: `rgb(${colorArray[3 * (i + height * canvasState.textWidth)]},${
                                                      colorArray[3 * (i + height * canvasState.textWidth) + 1]
                                                  },${colorArray[3 * (i + height * canvasState.textWidth) + 2]})`,
                                                  background: `rgba(${
                                                      colorArray[3 * (i + height * canvasState.textWidth)]
                                                  },${colorArray[3 * (i + height * canvasState.textWidth) + 1]},${
                                                      colorArray[3 * (i + height * canvasState.textWidth) + 2]
                                                  },0.4)`,
                                              }}
                                          >
                                              {s}
                                          </span>
                                      );
                                  })}
                                  <br />
                              </>
                          ))
                        : canvasState.aaText}
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
        letterSpacing: "-2px",
        width: textareaWidth,
        height: textareaHeight,
        padding,
        fontFamily:
            '"Courier New","Monaco","Osaka-等幅", "Osaka-Mono", "ＭＳ ゴシック", "MS Gothic", monospace !important;',
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
