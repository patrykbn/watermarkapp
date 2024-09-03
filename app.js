const { existsSync } = require('node:fs');
const Jimp = require('jimp');
const inquirer = require('inquirer');

const addTextWatermarkToImage = async function(image, outputFile, text) {
  try {
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
    image.print(font, 10, 10, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('Text watermark added successfully!');
  } catch (error) {
    console.error('Error adding text watermark:', error.message);
  }
};

const addImageWatermarkToImage = async function(image, outputFile, watermarkFile) {
  try {
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('Image watermark added successfully!');
  } catch (error) {
    console.error('Error adding image watermark:', error.message);
  }
};

const prepareOutputFilename = (filename) => {
  const [name, ext] = filename.split('.');
  return `${name}-with-watermark.${ext}`;
};

const adjustImage = async (image) => {
  let adjustMore = true;

  while (adjustMore) {
    const { adjust } = await inquirer.prompt([{
      name: 'adjust',
      type: 'list',
      message: 'What adjustment would you like to make?',
      choices: [
        'Adjust brightness',
        'Adjust contrast',
        'Black & white',
        'Invert image',
        'Done adjusting'
      ],
    }]);

    switch (adjust) {
        case 'Adjust brightness':
            const { brightness } = await inquirer.prompt([{
                name: 'brightness',
                type: 'number',
                message: 'Enter brightness value between -10 and 10',
                default: 0,
            }]);
            const brithnessNumber = brightness/10;
            image.brightness(brithnessNumber);
            break;
        case 'Adjust contrast':
            const { contrast } = await inquirer.prompt([{
                name: 'contrast',
                type: 'number',
                message: 'Enter contrast value between -10 and 10',
                default: 0,
            }]);
            const contrastNumber = contrast/10;
            image.brightness(contrastNumber);
            break;
        case 'Black & white':
            image.greyscale();
            break;
        case 'Invert image':
            image.invert();
            break;
        case 'Done adjusting':
            adjustMore = false;
            break;
    }
  }
  return image;
};

const startApp = async () => {
  try {
    const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm',
    }]);

    if (!answer.start) process.exit();

    const options = await inquirer.prompt([{
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    }, {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    }]);

    const inputFilePath = './img/' + options.inputImage;

    if (!existsSync(inputFilePath)) {
      console.log('The specified input file does not exist. Please try again.');
      process.exit();
    }

    const workImage = await Jimp.read(inputFilePath); // Create a work image from the input file

    const { adjustImageAnswer } = await inquirer.prompt([{
      name: 'adjustImageAnswer',
      type: 'confirm',
      message: 'Do you want to adjust the image before adding a watermark?',
    }]);

    if (adjustImageAnswer) {
      await adjustImage(workImage); // Apply adjustments to the work image
    }

    const outputFilePath = './img/' + prepareOutputFilename(options.inputImage);

    if (options.watermarkType === 'Text watermark') {
      const text = await inquirer.prompt([{
        name: 'value',
        type: 'input',
        message: 'Type your watermark text:',
        default: 'All rights reserved',
      }]);
      await addTextWatermarkToImage(workImage, outputFilePath, text.value);
    } else {
      const image = await inquirer.prompt([{
        name: 'filename',
        type: 'input',
        message: 'Type your watermark name:',
        default: 'logo.png',
      }]);
      const watermarkInputFilePath = './img/' + image.filename;

      if (!existsSync(watermarkInputFilePath)) {
        console.log('The specified watermark image does not exist. Please try again.');
        process.exit();
      }
      await addImageWatermarkToImage(workImage, outputFilePath, watermarkInputFilePath);
    }
    console.log('Watermark added successfully!');
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
  }
};

startApp();
