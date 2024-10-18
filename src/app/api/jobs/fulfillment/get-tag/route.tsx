import { cigo } from '@/app/actions/cigo';
import { shopify } from '@/app/actions/shopify';
import { formatPhone } from '@/app/utils/helpers';
import { Order } from '@/app/utils/types';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const orderName = searchParams.get('orderName');

  if (!orderName) {
    return NextResponse.json({ success: false, error: "Order name is required" }, { status: 400 });
  }

  // Get the order from Shopify
  const ordersList = await shopify.orders.list(`query: "name:${orderName}"`);
  const order = ordersList?.[0] as Order;
  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  // Get the delivery dates from CIGO
  const deliveryDates = await cigo.helpers.getDeliveryDates(order);
  const deliveryDate = deliveryDates?.[0];
  console.log("[Create Bag Tags] deliveryDates", deliveryDates);

  const ReactDOMServer = (await import('react-dom/server')).default;
  const phone = order?.customer?.phone || order?.billingAddress?.phone || order?.shippingAddress?.phone || ""
  const lineItems = order.line_items || order.lineItems?.nodes || []


  const stylesheet = {
    page: {
      display: 'flex',
      flexFlow: 'column',
      backgroundColor: 'white',
      color: 'black',
      width: '700px',
      padding: '32px',
      gap: '16px',
      fontFamily: 'CircularXX, sans-serif'
    },
    header: {
      display: 'flex',
      flexFlow: 'column',
      paddingBottom: '16px',
      borderBottom: '1px solid #d1d5db',
      gap: '8px'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    lineItems: {
      display: 'flex',
      flexFlow: 'column',
      gap: '16px',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '16px'
    },
    lineItemsTitle: {
      display: 'flex',
      flexFlow: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: '32px',
      fontSize: '20px',
      fontWeight: 'bold'
    },
    lineItem: {
      display: 'flex',
      flexFlow: 'row',
      gap: '16px',
      width: '100%'
    },
    lineItemImage: {
      borderRadius: '6px',
      height: '100px',
      width: '100px',
      minWidth: '100px',
      overflow: 'hidden'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    row: {
      display: 'flex',
      flexFlow: 'row',
    },
    rowLabel: {
      flex: 1,
      fontWeight: 'bold'
    },
    rowValue: {
      flex: 1
    },
    lineItemTitle: {
      flex: 1,
      maxWidth: '250px'
    },
    lineItemQuantity: {
      flex: 1
    },
    footer: {
      paddingBottom: '16px'
    },
    logo: {
      top: 0,
      right: 0
    }
  }

  // Create the component and import styles from Tailwind
  const component = (
    <html>
      <head>
        <style>{`
          @font-face {
            font-family: 'CircularXX';
            src: url('https://cdn.shopify.com/s/files/1/0627/5317/7763/files/CircularXX-Bold.otf') format('opentype');
            font-weight: bold;
          }
          @font-face {
            font-family: 'CircularXX';
            src: url('https://cdn.shopify.com/s/files/1/0627/5317/7763/files/CircularXX-Book.otf') format('opentype');
            font-weight: normal;
          }
        `}</style>
      </head>
      <body>
        <div style={stylesheet.page}>
          {/* Header */}
          <div style={{ ...stylesheet.header, position: 'relative' }}>
            <h1 style={stylesheet.title}>#{order.name}</h1>
            <div style={stylesheet.row}>
              <div style={stylesheet.rowLabel}>Customer</div>
              <div style={stylesheet.rowValue}>{`${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`}</div>
            </div>
            <div style={stylesheet.row}>
              <div style={stylesheet.rowLabel}>Phone</div>
              <div style={stylesheet.rowValue}>{formatPhone(phone) || ""}</div>
            </div>
            <div style={stylesheet.row}>
              <div style={stylesheet.rowLabel}>Delivery Date</div>
              <div style={stylesheet.rowValue}>{new Date(deliveryDate).toLocaleDateString("en-US", { year: 'numeric', weekday: 'long', month: 'long', day: 'numeric' }) || ""}</div>
            </div>
            <div style={{ position: 'absolute', ...stylesheet.logo }}>
              <img src="https://cdn.shopify.com/s/files/1/0627/5317/7763/files/WECO-Logo-Square-Green_1.png" alt="WECO" width={60} height={60} />
            </div>
          </div>
          {/* Line Items */}
          <div style={stylesheet.lineItems}>
            <div style={stylesheet.lineItemsTitle}>
              Your Menu
            </div>
            {lineItems.map((item: any, index: number) => (
              <div key={index} style={stylesheet.lineItem}>
                <div style={stylesheet.lineItemImage}>
                  <img src={item.image.url} alt={item.name} width={100} height={100} style={{ objectFit: 'cover', objectPosition: 'center', height: '100%', width: '100%' }} />
                </div>
                <div style={stylesheet.lineItem}>
                  <div style={stylesheet.lineItemTitle}>{item.name.split(" - ")[0]}</div>
                  <div style={stylesheet.lineItemQuantity}>{`x ${item.quantity}`}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={stylesheet.footer}>
            Issues with your order? Reach out to us at <a href="mailto:weco@wecohospitality.com" style={{ fontWeight: 'bold', color: 'black', borderBottom: '2px solid black', textDecoration: 'none' }}>weco@wecohospitality.com</a>
          </div>
        </div>
      </body>
    </html>
  )

  // Convert the component to a static html string
  const html = ReactDOMServer.renderToString(component) as string;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
