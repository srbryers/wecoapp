import { NextResponse } from 'next/server';
import { jsPDF } from "jspdf";
import nodeHtmlToImage from 'node-html-to-image';

export async function POST(request: Request) {
  const body = await request.json();

  console.log("[Create Bag Tags] body", body);

  if (!body.orderName && !body.orderId) {
    return NextResponse.json({ success: false, error: "One of orderName or orderId is required" }, { status: 400 });
  }

  // Fetch the tag html from the get-tag endpoint
  const tagResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/fulfillment/get-tag?orderName=${body.orderName}`);
  const html = await tagResponse.text();
  // // Use node-html-to-image to convert the html to an image
  const images = await nodeHtmlToImage({
    html: html,
    quality: 100,
    type: 'png',
    puppeteerArgs: {
      defaultViewport: {
        width: 800,
        height: 600,
        deviceScaleFactor: 3
      }
    },
    content: [{ id: 1 }, { id: 2}]
  }) as Buffer[]

  // // Join the images into a single image 
  // const concatenatedImages = Buffer.concat(images);

  // Use jsPDF to create a PDF from the images
  const doc = new jsPDF();

  // Add a page for each image
  images.forEach((image, index) => {
    const imageBuffer = image.toString('base64');
    doc.addPage();
    doc.addImage(imageBuffer, 'PNG', 0, 0, 210, 297);
  });

  const pdfBuffer = doc.output('arraybuffer');

  console.log("[Create Bag Tags] pdfBuffer", pdfBuffer);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
    },
  });

  // Turn the images into base64
  // const base64Images = images.map(image => image.toString('base64'));

  // return NextResponse.json({ success: true, pdfBuffer: pdfBuffer }, { status: 200 });
}
