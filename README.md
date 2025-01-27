# Vue Sketcher

Vue Sketcher is a simple and flexible drawing library for Vue.js.

# Live Demo

Coming soon! 😊

## Features

- Very lightweight and easy to use!
- Draw smooth brush strokes & erase
- Adjustable brush size and color picker
- Draw rectangles and circles with a preview while dragging
- Undo/redo with a configurable history limit
- Save the drawing as an image

## Installation

```bash
npm install vue-sketcher
```

## Getting Started

To quickly get started, follow these steps:

1. Install the library:

    ```bash
    npm install vue-sketcher
    ```

2. Import and use the component in your Vue application:

    ```vue
    <template>
        <VueSketcher
            :canvasWidth="800"
            :canvasHeight="600"
            :defaultBrushSize="5"
            :defaultColor="'#000'"
            :maxHistorySteps="10"
        />
    </template>

    <script setup>
    import VueSketcher from 'vue-sketcher';
    </script>
    ```

## Props

| Prop             | Type    | Default   | Description                                              |
| ---------------- | ------- | --------- | -------------------------------------------------------- |
| canvasWidth      | Number  | 800       | Width of the canvas in pixels                            |
| canvasHeight     | Number  | 600       | Height of the canvas in pixels                           |
| defaultColor     | String  | '#000000' | Default brush color                                      |
| defaultBrushSize | Number  | 5         | Default brush size                                       |
| backgroundColor  | String  | '#ffffff' | Background color of the canvas                           |
| maxHistorySteps  | Number  | 50        | Maximum number of undo/redo steps                        |
| defaultTool      | String  | 'brush'   | Default tool selected (brush, eraser, rectangle, circle) |
| fillShapes       | Boolean | true      | Whether to fill shapes (rectangles and circles)          |

## Running the demo

```bash
git clone git@github.com:Bubalubs/vue-sketcher.git
cd vue-sketcher
npm install
npm run dev
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request. 😊

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.
