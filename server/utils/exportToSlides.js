import pptxgen from "pptxgenjs";

export function exportToSlides(steps) {
  let pptx = new pptxgen();
  steps.forEach((step, i) => {
    let slide = pptx.addSlide();
    slide.addText(`Step ${i + 1}`, { x: 1, y: 0.5, fontSize: 18, bold: true });
    slide.addText(step.text, { x: 1, y: 1, fontSize: 14 });
  });
  pptx.writeFile("MathSession.pptx");
}
