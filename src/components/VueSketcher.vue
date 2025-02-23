<template>
    <div class="drawing-container">
        <div class="controls">
            <div class="control-group">
                <label for="colorPicker">Color</label>
                <input
                    type="color"
                    id="colorPicker"
                    :value="selectedColor"
                    @input="handleColorChange"
                />
            </div>

            <div class="control-group">
                <label for="brushSize">Size</label>
                <input
                    type="range"
                    id="brushSize"
                    :min="1"
                    :max="50"
                    :value="brushSize"
                    @input="handleBrushSizeChange"
                />
            </div>

            <div class="tool-buttons">
                <div
                    v-for="btn in availableTools"
                    :key="btn.name"
                    :class="['tool-button', { active: currentTool === btn.name }]"
                    :data-tool="btn.name"
                    @click="setTool(btn.name)"
                >
                    <span>{{ btn.label }}</span>
                </div>
            </div>

            <button @click="undoCanvas" title="Undo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon">
                    <path
                        d="M125.7 160l50.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L48 224c-17.7 0-32-14.3-32-32L16 64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z"
                    />
                </svg>
            </button>
            <button @click="redoCanvas">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon">
                    <path
                        d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"
                    />
                </svg>
            </button>
            <button @click="saveCanvasImage">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="icon">
                    <path
                        d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"
                    />
                </svg>
            </button>
            <button @click="clearCanvas">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="icon">
                    <path
                        d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
                    />
                </svg>
            </button>
        </div>

        <div class="canvas-container" :style="{ backgroundColor: backgroundColor }">
            <canvas ref="drawingCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';

export default defineComponent({
    name: 'AdvancedDrawingCanvas',

    props: {
        canvasWidth: {
            type: Number,
            default: 800,
        },
        canvasHeight: {
            type: Number,
            default: 600,
        },
        defaultColor: {
            type: String,
            default: '#000000',
        },
        defaultBrushSize: {
            type: Number,
            default: 5,
        },
        backgroundColor: {
            type: String,
            default: '#ffffff',
        },
        maxHistorySteps: {
            type: Number,
            default: 50,
        },
        defaultTool: {
            type: String,
            default: 'brush',
        },
        fillShapes: {
            type: Boolean,
            default: true,
        },
    },

    setup(props) {
        const drawingCanvas = ref<HTMLCanvasElement | null>(null);
        const ctx = ref<CanvasRenderingContext2D | null>(null);

        const overlayCanvas = ref<HTMLCanvasElement | null>(null);
        const overlayCtx = ref<CanvasRenderingContext2D | null>(null);

        const selectedColor = ref(props.defaultColor);
        const brushSize = ref(props.defaultBrushSize);
        const currentTool = ref(props.defaultTool);

        const drawing = ref(false);
        const lastX = ref(0);
        const lastY = ref(0);
        const startX = ref(0);
        const startY = ref(0);

        const historyStack = ref<string[]>([]);
        const redoStack = ref<string[]>([]);

        const availableTools = computed(() => [
            { name: 'brush', label: '🖌️' },
            { name: 'eraser', label: '🧽' },
            { name: 'rectangle', label: '⬛' },
            { name: 'circle', label: '⚪' },
        ]);

        const saveState = () => {
            if (!drawingCanvas.value) return;
            historyStack.value.push(drawingCanvas.value.toDataURL());
            if (historyStack.value.length > props.maxHistorySteps) historyStack.value.shift();
            redoStack.value = [];
        };

        const loadState = (state: string) => {
            if (!ctx.value) return;
            const img = new Image();
            img.src = state;
            img.onload = () => {
                ctx.value?.clearRect(0, 0, props.canvasWidth, props.canvasHeight);
                ctx.value?.drawImage(img, 0, 0);
            };
        };

        const undoCanvas = () => {
            if (!ctx.value || historyStack.value.length === 0) return;
            redoStack.value.push(historyStack.value.pop() as string);
            const lastState = historyStack.value[historyStack.value.length - 1] || null;
            if (lastState) {
                loadState(lastState);
            } else {
                ctx.value.clearRect(0, 0, props.canvasWidth, props.canvasHeight);
            }
        };

        const redoCanvas = () => {
            if (!ctx.value || redoStack.value.length === 0) return;
            const state = redoStack.value.pop() as string;
            historyStack.value.push(state);
            loadState(state);
        };

        const clearCanvas = () => {
            if (!ctx.value || !drawingCanvas.value) return;

            ctx.value.fillStyle = props.backgroundColor || '#ffffff';
            ctx.value.fillRect(0, 0, props.canvasWidth, props.canvasHeight);

            saveState();
        };

        const saveCanvasImage = () => {
            if (!drawingCanvas.value) return;
            const dataURL = drawingCanvas.value.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'drawing.png';
            link.click();
        };

        const drawStroke = (x1: number, y1: number, x2: number, y2: number) => {
            if (!ctx.value) return;
            ctx.value.strokeStyle = selectedColor.value;
            ctx.value.lineWidth = brushSize.value;
            ctx.value.lineCap = 'round';
            ctx.value.lineJoin = 'round';
            ctx.value.beginPath();
            ctx.value.moveTo(x1, y1);
            ctx.value.lineTo(x2, y2);
            ctx.value.stroke();
        };

        const drawRectangle = (x: number, y: number) => {
            if (!overlayCanvas.value || !overlayCtx.value) return;

            overlayCtx.value.clearRect(0, 0, props.canvasWidth, props.canvasHeight);

            const rectX = Math.min(startX.value, x);
            const rectY = Math.min(startY.value, y);
            const rectWidth = Math.abs(x - startX.value);
            const rectHeight = Math.abs(y - startY.value);

            if (props.fillShapes) {
                overlayCtx.value.fillStyle = selectedColor.value;
                overlayCtx.value.fillRect(rectX, rectY, rectWidth, rectHeight);
            } else {
                overlayCtx.value.strokeStyle = selectedColor.value;
                overlayCtx.value.lineWidth = brushSize.value;
                overlayCtx.value.strokeRect(rectX, rectY, rectWidth, rectHeight);
            }
        };

        const drawCircle = (x: number, y: number) => {
            if (!overlayCanvas.value || !overlayCtx.value) return;

            overlayCtx.value.clearRect(0, 0, props.canvasWidth, props.canvasHeight);

            const radius = Math.sqrt((x - startX.value) ** 2 + (y - startY.value) ** 2);

            if (props.fillShapes) {
                overlayCtx.value.fillStyle = selectedColor.value;
                overlayCtx.value.beginPath();
                overlayCtx.value.arc(startX.value, startY.value, radius, 0, Math.PI * 2);
                overlayCtx.value.fill();
            } else {
                overlayCtx.value.strokeStyle = selectedColor.value;
                overlayCtx.value.lineWidth = brushSize.value;
                overlayCtx.value.beginPath();
                overlayCtx.value.arc(startX.value, startY.value, radius, 0, Math.PI * 2);
                overlayCtx.value.stroke();
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (!drawingCanvas.value) return;
            drawing.value = true;
            const rect = drawingCanvas.value.getBoundingClientRect();
            startX.value = lastX.value = e.clientX - rect.left;
            startY.value = lastY.value = e.clientY - rect.top;
            if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
                saveState();
            }
        };

        const handleMouseUp = () => {
            if (!drawing.value) return;
            const rect = drawingCanvas.value?.getBoundingClientRect();
            if (!rect || !ctx.value || !overlayCtx.value || !overlayCanvas.value) return;

            if (currentTool.value === 'rectangle' || currentTool.value === 'circle') {
                ctx.value.drawImage(overlayCanvas.value as CanvasImageSource, 0, 0);
            }

            overlayCtx.value.clearRect(0, 0, props.canvasWidth, props.canvasHeight);
            saveState();
            drawing.value = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!drawing.value || !ctx.value || !drawingCanvas.value) return;
            const rect = drawingCanvas.value.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (currentTool.value === 'brush') {
                drawStroke(lastX.value, lastY.value, x, y);
                lastX.value = x;
                lastY.value = y;
            } else if (currentTool.value === 'eraser') {
                ctx.value.strokeStyle = '#ffffff';
                ctx.value.lineWidth = brushSize.value;
                ctx.value.lineCap = 'round';
                ctx.value.beginPath();
                ctx.value.moveTo(lastX.value, lastY.value);
                ctx.value.lineTo(x, y);
                ctx.value.stroke();
                lastX.value = x;
                lastY.value = y;
            } else if (currentTool.value === 'rectangle') {
                drawRectangle(x, y);
            } else if (currentTool.value === 'circle') {
                drawCircle(x, y);
            }
        };

        const setTool = (toolName: string) => {
            currentTool.value = toolName;
        };

        const updateColor = (colorValue: string) => {
            selectedColor.value = colorValue;
        };

        const updateBrushSize = (newSize: string) => {
            brushSize.value = parseInt(newSize, 10);
        };

        const handleBrushSizeChange = (e: Event) => {
            const input = e.target as HTMLInputElement;
            if (!input) return;
            brushSize.value = parseInt(input.value, 10);
        };

        const handleColorChange = (e: Event) => {
            const input = e.target as HTMLInputElement | null;
            if (!input) return;
            updateColor(input.value);
        };

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            if (!drawingCanvas.value) return;
            const rect = drawingCanvas.value.getBoundingClientRect();
            const touch = e.touches[0];
            startX.value = lastX.value = touch.clientX - rect.left;
            startY.value = lastY.value = touch.clientY - rect.top;
            drawing.value = true;
            if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
                saveState();
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (!drawing.value || !ctx.value || !drawingCanvas.value) return;
            const rect = drawingCanvas.value.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (currentTool.value === 'brush') {
                drawStroke(lastX.value, lastY.value, x, y);
                lastX.value = x;
                lastY.value = y;
            } else if (currentTool.value === 'eraser') {
                ctx.value.strokeStyle = '#ffffff';
                ctx.value.lineWidth = brushSize.value;
                ctx.value.lineCap = 'round';
                ctx.value.beginPath();
                ctx.value.moveTo(lastX.value, lastY.value);
                ctx.value.lineTo(x, y);
                ctx.value.stroke();
                lastX.value = x;
                lastY.value = y;
            } else if (currentTool.value === 'rectangle') {
                drawRectangle(x, y);
            } else if (currentTool.value === 'circle') {
                drawCircle(x, y);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            if (!drawing.value) return;
            if (currentTool.value === 'rectangle' || currentTool.value === 'circle') {
                ctx.value?.drawImage(overlayCanvas.value as CanvasImageSource, 0, 0);
            }
            overlayCtx.value?.clearRect(0, 0, props.canvasWidth, props.canvasHeight);
            saveState();
            drawing.value = false;
        };

        onMounted(() => {
            if (!drawingCanvas.value) return;
            ctx.value = drawingCanvas.value.getContext('2d');
            if (!ctx.value) return;

            ctx.value.fillStyle = props.backgroundColor || '#ffffff';
            ctx.value.fillRect(0, 0, props.canvasWidth, props.canvasHeight);

            overlayCanvas.value = document.createElement('canvas');
            overlayCanvas.value.width = props.canvasWidth;
            overlayCanvas.value.height = props.canvasHeight;
            overlayCanvas.value.style.position = 'absolute';
            overlayCanvas.value.style.top = '22px';
            overlayCanvas.value.style.left = '22px';
            overlayCanvas.value.style.pointerEvents = 'none';
            overlayCanvas.value.style.zIndex = '10';
            overlayCtx.value = overlayCanvas.value.getContext('2d');

            const canvasContainer = document.querySelector('.canvas-container');
            if (canvasContainer) {
                canvasContainer.appendChild(overlayCanvas.value);
            }

            const adjustCanvasSize = () => {
                const containerWidth =
                    document.querySelector('.canvas-container')?.clientWidth || 0;
                const scale = containerWidth / props.canvasWidth;

                if (scale < 1) {
                    drawingCanvas.value!.width = props.canvasWidth * scale;
                    drawingCanvas.value!.height = props.canvasHeight * scale;
                } else {
                    drawingCanvas.value!.width = props.canvasWidth;
                    drawingCanvas.value!.height = props.canvasHeight;
                }

                ctx.value = drawingCanvas.value!.getContext('2d');
                overlayCanvas.value!.width = drawingCanvas.value!.width;
                overlayCanvas.value!.height = drawingCanvas.value!.height;
            };

            adjustCanvasSize();
            window.addEventListener('resize', adjustCanvasSize);

            drawingCanvas.value.addEventListener('mousedown', handleMouseDown);
            drawingCanvas.value.addEventListener('mouseup', handleMouseUp);
            drawingCanvas.value.addEventListener('mousemove', handleMouseMove);

            drawingCanvas.value.addEventListener('touchstart', handleTouchStart);
            drawingCanvas.value.addEventListener('touchmove', handleTouchMove);
            drawingCanvas.value.addEventListener('touchend', handleTouchEnd);

            saveState();
        });

        return {
            drawingCanvas,
            selectedColor,
            brushSize,
            currentTool,
            availableTools,
            undoCanvas,
            redoCanvas,
            clearCanvas,
            saveCanvasImage,
            setTool,
            updateColor,
            updateBrushSize,
            handleBrushSizeChange,
            handleColorChange,
        };
    },
});
</script>

<style scoped>
.drawing-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0;
    font-family: Arial, sans-serif;
    background-color: #f9f9f9;
    padding: 20px;
}

.canvas-container {
    position: relative;
    overflow: hidden;
    padding: 20px;
    border-radius: 10px;
    margin-top: 20px;
}

.tool-buttons {
    display: flex;
    gap: 10px;
}

.tool-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 2px solid transparent;
    border-radius: 50%;
    background-color: #f0f0f0;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tool-button:hover {
    background-color: #ddd;
}

.tool-button.active {
    border-color: #000;
    background-color: #e0e0e0;
}

.controls {
    width: 800px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
    padding: 10px 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.control-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
}

.control-group label {
    font-weight: bold;
    color: #333;
}

.controls input {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 14px;
    color: #333;
}

.controls button {
    background-color: #000;
    color: #fff;
    border: none;
    padding: 10px 10px 6px 10px;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.controls button:hover {
    background-color: #2e41bf;
}

.controls input[type='range'] {
    appearance: none;
    -webkit-appearance: none;
    width: 100px;
    height: 5px;
    border-radius: 5px;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
}

.controls input[type='color'] {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
}

.icon {
    width: 18px;
    height: 18px;
    fill: white;
}

canvas {
    border: 2px solid #000;
    cursor: crosshair;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    touch-action: none;
}

@media (max-width: 768px) {
    .drawing-container {
        padding: 10px;
    }

    .canvas-container {
        padding: 10px;
        margin-top: 10px;
    }

    .controls {
        flex-direction: column;
        width: auto;
        padding: 20px;
        gap: 8px;
    }

    .tool-buttons {
        gap: 8px;
    }

    .control-group {
        flex-direction: column;
    }

    .controls input[type='range'] {
        width: 100%;
    }

    canvas {
        width: 100%;
        height: auto;
    }
}
</style>
