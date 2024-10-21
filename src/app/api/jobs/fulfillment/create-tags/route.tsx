import { NextResponse } from 'next/server';
import { jsPDF } from "jspdf";
import nodeHtmlToImage from 'node-html-to-image';
import { shopify } from '@/app/actions/shopify';
import { cigo } from '@/app/actions/cigo';

export async function POST(request: Request) {
  const body = await request.json();

  console.log("[Create Bag Tags] body", body);

  if (!body.deliveryDate) {
    return NextResponse.json({ success: false, error: "Delivery date is required" }, { status: 400 });
  }

  // Fetch the tag html from the get-tag endpoint
  const deliveryDate = body.deliveryDate || new Date().toISOString().split('T')[0]
  const ordersList = await shopify.orders.list(`query: "tag:delivery AND tag:${deliveryDate}"`)
  const doc = new jsPDF();

  const jobIds = (await cigo.jobs.search({
    start_date: deliveryDate,
    end_date: deliveryDate,
  }))?.post_staging?.ids

  // console.log("[Create Bag Tags] jobIds", jobIds);
  const jobs = []

  // Create a PDF page for each order
  for (const jobId of jobIds) {
    // Log progress
    const jobIndex = jobIds.indexOf(jobId);
    console.log(`[Create Bag Tags] Processing job ${jobIndex + 1} of ${jobIds.length}`);
    // Get the job from CIGO
    
    const job = (await cigo.jobs.get(jobId))?.job
    jobs.push(job)

  }

  // Sort by route number and then by position
  const sortedByRoute = jobs.sort((a: any, b: any) => {
    const sortKeyA = `${a.post_staging.scheduling.vehicle.split(" ")[1]}.${Number(a.post_staging.scheduling.position) < 10 ? "0" + a.post_staging.scheduling.position : a.post_staging.scheduling.position}`;
    const sortKeyB = `${b.post_staging.scheduling.vehicle.split(" ")[1]}.${Number(b.post_staging.scheduling.position) < 10 ? "0" + b.post_staging.scheduling.position : b.post_staging.scheduling.position}`;
    return sortKeyA.localeCompare(sortKeyB);
  })

  // console.log("[Create Bag Tags] sortedByRoute", sortedByRoute);



  for (const job of sortedByRoute) {
    // console.log("[Create Bag Tags] job", job);
    // return
    // const order = await shopify.orders.get(job?.invoices[0].split("-")[0])
    const order = ordersList.find((order: any) => job?.invoices.find((invoice: any) => invoice.includes(order.id.toString().split("/").pop())))
    console.log("[Create Bag Tags] order", order?.name);
    // console.log("[Create Bag Tags] order.lineItems", order);

    // Add a header to the PDF with the route number from the CIGO job
    if (job && job?.post_staging?.scheduling?.vehicle && order) {
      doc.addPage();
      const routeNumber = job?.post_staging?.scheduling?.vehicle;
      const routePosition = job?.post_staging?.scheduling?.position;
      const formattedPhone = (order.customer?.phone || order.shippingAddress?.phone)?.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
      // Add the route number in large bold text, centered in the middle of the page
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${routeNumber}.${routePosition}`, 100, 15, { align: 'center', maxWidth: 180 });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(`${order.name}`, 100, 25, { align: 'center', maxWidth: 180 });
      // Add the customer name and phone number in large bold text
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(`${order.customer?.firstName} ${order.customer?.lastName}`, 100, 50, { align: 'center'});
      doc.setFont('helvetica', 'normal');
      // Add customer address
      doc.setFontSize(14);
      doc.text(`${order.shippingAddress?.address1} ${order.shippingAddress?.address2 ? order.shippingAddress?.address2 + " " : ""}${order.shippingAddress?.city}, ${order.shippingAddress?.province} ${order.shippingAddress?.zip}`, 100, 60, { align: 'center' });
      doc.text(`${formattedPhone}`, 100, 70, { align: 'center' });

      doc.setFontSize(16);
      // Add the line items to the PDF
      const lineItems = order.lineItems?.nodes?.filter((item: any) => item.name.includes(deliveryDate)).map((item: any) => {
        return {
          "Item": item.name.split(" - ")[0],
          "Quantity": `${item.quantity}`
        }
      })
      doc.table(50, 80, lineItems || [], ['Item', 'Quantity'], {
        autoSize: true,
        headerBackgroundColor: "#FFFFFF",
        printHeaders: false,
        padding: 4
      },)
      
    } else {
      console.log(`No route number found for job ${job?.id}`);
    }
  }
  
  // const tagResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/fulfillment/get-tag?orderName=${body.orderName}`);
  // const html = await tagResponse.text();
  // // Use node-html-to-image to convert the html to an image
  // const images = await nodeHtmlToImage({
  //   html: html,
  //   quality: 100,
  //   type: 'png',
  //   puppeteerArgs: {
  //     defaultViewport: {
  //       width: 800,
  //       height: 600,
  //       deviceScaleFactor: 3
  //     }
  //   },
  //   content: [{ id: 1 }, { id: 2}]
  // }) as Buffer[]

  // // Join the images into a single image 
  // const concatenatedImages = Buffer.concat(images);

  // Use jsPDF to create a PDF from the images
  

  // Add a page for each image
  // images.forEach((image, index) => {
  //   const imageBuffer = image.toString('base64');
  //   doc.addPage();
  //   doc.addImage(imageBuffer, 'PNG', 0, 0, 210, 297);
  // });

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
