<template>
    <div class="drawing-container">
        <div class="controls">
            <div class="control-group">
                <label for="colorPicker">Color:</label>
                <input
                    type="color"
                    id="colorPicker"
                    :value="selectedColor"
                    @input="handleColorChange"
                />
            </div>

            <div class="control-group">
                <label for="brushSize">Size:</label>
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

            <button @click="undoCanvas">Undo</button>
            <button @click="redoCanvas">Redo</button>
            <button @click="saveCanvasImage">Save</button>
            <button @click="clearCanvas">Clear</button>
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

        const handleMouseDown = (evt: MouseEvent) => {
            if (!drawingCanvas.value) return;
            drawing.value = true;
            const rect = drawingCanvas.value.getBoundingClientRect();
            startX.value = lastX.value = evt.clientX - rect.left;
            startY.value = lastY.value = evt.clientY - rect.top;
            if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
                saveState();
            }
        };

        const handleMouseUp = (evt: MouseEvent) => {
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

        const handleMouseMove = (evt: MouseEvent) => {
            if (!drawing.value || !ctx.value || !drawingCanvas.value) return;
            const rect = drawingCanvas.value.getBoundingClientRect();
            const x = evt.clientX - rect.left;
            const y = evt.clientY - rect.top;

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

        const handleBrushSizeChange = (evt: Event) => {
            const input = evt.target as HTMLInputElement;
            if (!input) return;
            brushSize.value = parseInt(input.value, 10);
        };

        const handleColorChange = (evt: Event) => {
            const input = evt.target as HTMLInputElement | null;
            if (!input) return;
            updateColor(input.value);
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
            overlayCanvas.value.style.top = '62px';
            overlayCanvas.value.style.left = '62px';
            overlayCanvas.value.style.pointerEvents = 'none';
            overlayCanvas.value.style.zIndex = '10';
            overlayCtx.value = overlayCanvas.value.getContext('2d');

            const canvasContainer = document.querySelector('.canvas-container');
            if (canvasContainer) {
                canvasContainer.appendChild(overlayCanvas.value);
            }

            drawingCanvas.value.addEventListener('mousedown', handleMouseDown);
            drawingCanvas.value.addEventListener('mouseup', handleMouseUp);
            drawingCanvas.value.addEventListener('mousemove', handleMouseMove);
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
    padding: 8px 15px;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
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

.controls button:hover {
    background-color: #333;
}

canvas {
    border: 2px solid #000;
    cursor: crosshair;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
