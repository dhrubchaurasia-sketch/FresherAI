// import {PDFParse} from "pdf-parse";
// import fs from "fs";
// const  extractText = async (filePath) =>{
//     const buffer = fs.readFileSync(filePath)

//     const pdf = new PDFParse({
//         data : buffer
//     })
    

//     const result = await pdf.getText()
  
//     return result.text
// }
// export default extractText;


import { PDFParse } from "pdf-parse";
import fs from "fs";

const extractText = async (filePath) => {
  let pdf;

  try {
    const buffer = fs.readFileSync(filePath);

    pdf = new PDFParse({
      data: buffer,
    });

    const result = await pdf.getText();

    return result.text;
  } catch (error) {
    console.error("PDF EXTRACTION ERROR:", error);
    throw error;
  } finally {
    if (pdf) {
      await pdf.destroy();
    }
  }
};

export default extractText;
