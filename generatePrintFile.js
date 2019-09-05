const sharp = require("sharp");
const path = require("path");

const layersDefault = [
  {
    image: "texture-panda",
    width: 706,
    height: 1199,
    xPosition: 59,
    yPosition: -63
  },
  {
    image: "texture-ny",
    width: 706,
    height: 1199,
    xPosition: -316,
    yPosition: 211
  },
  {
    image: "texture-sheep",
    width: 367,
    height: 334,
    xPosition: 186,
    yPosition: 408
  }
];

const printFileDimensionsDefault = {
  height: 1200,
  width: 706
};

const getLayerExtractAndExtend = ({ printFileSize, layerSize, position }) => {
  let extractStart;
  let extractSize;
  let extendStart;
  let extendEnd;
  if (position < 0) {
    extractStart = -position;
    extractSize = layerSize + position;

    if (extractSize > printFileSize) {
      extractSize = printFileSize;
    }

    extendStart = 0;
    extendEnd = printFileSize - extractSize;
    if (extractSize <= 0) {
      throw new Error("User design not visible");
    }
  } else {
    extractStart = 0;
    extractSize = printFileSize - position;
    if (extractSize <= 0) {
      throw new Error("User design not visible");
    }

    extendStart = position;
    if (extractSize > layerSize) {
      extendEnd = printFileSize - layerSize - position;
      extractSize = layerSize;
    } else {
      extendEnd = 0;
    }
  }

  return {
    extractStart,
    extractSize,
    extendStart,
    extendEnd
  };
};

const processOneLayer = layer => {
  const { height: printFileHeight, width: printFileWidth } = printFileDimensionsDefault;

  const { image, width, height, xPosition, yPosition } = layer;

  const {
    extractStart: extractLeft,
    extractSize: extractWidth,
    extendStart: extendLeft,
    extendEnd: extendRight
  } = getLayerExtractAndExtend({
    printFileSize: printFileWidth,
    layerSize: width,
    position: xPosition
  });

  const {
    extractStart: extractTop,
    extractSize: extractHeight,
    extendStart: extendTop,
    extendEnd: extendBottom
  } = getLayerExtractAndExtend({
    printFileSize: printFileHeight,
    layerSize: height,
    position: yPosition
  });

  return sharp(image)
    .resize(width, height)
    .extract({
      left: extractLeft,
      width: extractWidth,
      top: extractTop,
      height: extractHeight
    })
    .extend({
      top: extendTop,
      bottom: extendBottom,
      left: extendLeft,
      right: extendRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
};

module.exports.composite = (destination, counter) => {
  let layers;

  try {
    layers = layersDefault.map(processOneLayer);
  } catch (error) {
    console.log("composite() - Failed to initiate processing for one of the layers");
    return Promise.reject(error);
  }

  if (layers.length === 0) {
    const { height: printFileHeight, width: printFileWidth } = printFileDimensionsDefault;

    layers.push(
      sharp(null, {
        create: {
          width: printFileWidth,
          height: printFileHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
    );
  }

  let result;
  const firstLayer = layers.shift();

  if (layers.length > 0) {
    result = Promise.all(
      layers.map(layer => {
        return layer.toBuffer().catch(err => {
          console.log("composite() - Failed to process one of the layers");
          throw err;
        });
      })
    ).then(buffers => {
      return firstLayer.composite(
        buffers.map(buffer => ({
          input: buffer
        }))
      );
    });
  } else {
    result = firstLayer;
  }

  if (!(result instanceof Promise)) {
    result = Promise.resolve(result);
  }

  return result.then(operation => {
    return operation.png().toFile(path.join(destination, "print-file-" + counter));
  });
};

module.exports.single = (destination, counter) => {
  return processOneLayer(layersDefault[0])
    .png()
    .toFile(path.join(destination, "print-file-" + counter));
};

module.exports.simpleToFile = (destination, counter) => {
  return sharp(layersDefault[0].image).toFile(path.join(destination, "print-file-" + counter));
};

module.exports.simpleToBuffer = () => {
  return sharp(layersDefault[0].image).toBuffer();
};
