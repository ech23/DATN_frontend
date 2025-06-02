import { Injectable } from '@angular/core';
// Use require instead of import to avoid TypeScript errors
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;




@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  /**
   * Generates and opens an invoice PDF for an order
   * @param order The order data
   * @param orderDetails The order details/items
   */
  generateInvoice(order: any, orderDetails: any[]): void {
    try {
      // Use chunked processing for larger order details
      const processedOrderDetails = this.processOrderDetailsInChunks(orderDetails);
      const docDefinition = this.createInvoiceDefinition(order, processedOrderDetails);
      
      pdfMake.createPdf(docDefinition).open();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate an invoice PDF for an order and download it
   * @param order The order data
   * @param orderDetails The order details/items
   */
  downloadInvoice(order: any, orderDetails: any[]): void {
    try {
      // Use chunked processing for larger order details
      const processedOrderDetails = this.processOrderDetailsInChunks(orderDetails);
      const docDefinition = this.createInvoiceDefinition(order, processedOrderDetails);
      
      pdfMake.createPdf(docDefinition).download(`Hoa-don-${order.id}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Process order details in chunks to avoid memory issues
   * @param orderDetails The full array of order details
   * @returns Processed order details
   */
  private processOrderDetailsInChunks(orderDetails: any[]): any[] {
    // If the order has too many items, limit to avoid memory issues
    const MAX_ITEMS = 50;
    if (orderDetails.length > MAX_ITEMS) {
      console.warn(`Order has ${orderDetails.length} items, limiting to ${MAX_ITEMS} to avoid memory issues`);
      return orderDetails.slice(0, MAX_ITEMS);
    }
    
    // Process details in chunks if needed (for future optimization)
    return orderDetails.map(item => ({
      productId: item.productId,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity)
    }));
  }

  /**
   * Creates the PDF document definition for an invoice
   * @param order The order data
   * @param orderDetails The order details/items
   * @returns PDF document definition
   */
  private createInvoiceDefinition(order: any, orderDetails: any[]): any {
    // Format date
    const orderDate = new Date(order.orderDate);
    const formattedDate = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`;

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Generate the items table data
    const tableBody: any[][] = [
      [
        { text: 'STT', style: 'tableHeader', alignment: 'center' },
        { text: 'Sản phẩm', style: 'tableHeader' },
        { text: 'Đơn giá', style: 'tableHeader', alignment: 'right' },
        { text: 'Số lượng', style: 'tableHeader', alignment: 'center' },
        { text: 'Thành tiền', style: 'tableHeader', alignment: 'right' }
      ]
    ];

    // Add order items to the table
    orderDetails.forEach((item, index) => {
      tableBody.push([
        { text: (index + 1).toString(), alignment: 'center' },
        { text: item.name },
        { text: formatCurrency(item.price), alignment: 'right' },
        { text: item.quantity.toString(), alignment: 'center' },
        { text: formatCurrency(item.price * item.quantity), alignment: 'right' }
      ]);
    });

    // Add total row
    tableBody.push([
      { text: '', colSpan: 3 },
      {},
      {},
      { text: 'Tổng cộng:', style: 'tableFooter', alignment: 'right' },
      { text: formatCurrency(order.totalPrice), style: 'tableFooter', alignment: 'right' }
    ]);

    // Create invoice definition
    return {
      content: [
        // Header
        {
          columns: [
            {
              stack: [
                { text: 'OGANI SHOP', style: 'companyName' },
                { text: 'Địa chỉ: Số 298 Đ. Cầu Diễn, Minh Khai, Bắc Từ Liêm, Hà Nội' },
                { text: 'Điện thoại: 0352901842' },
                { text: 'Email: ogani@gmail.com' }
              ],
              width: '*'
            },
            {
              stack: [
                { text: 'HÓA ĐƠN BÁN HÀNG', style: 'invoiceTitle' },
                { text: `Số hóa đơn: #${order.id}`, style: 'invoiceSubTitle' },
                { text: `Ngày: ${formattedDate}`, style: 'invoiceSubTitle' }
              ],
              width: 'auto',
              alignment: 'right'
            }
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20]
        },

        // Customer Information
        {
          columns: [
            {
              stack: [
                { text: 'THÔNG TIN KHÁCH HÀNG', style: 'sectionHeader' },
                { text: `Họ tên: ${order.firstname} ${order.lastname}` },
                { text: `Điện thoại: ${order.phone}` },
                { text: `Email: ${order.email}` },
                { text: `Địa chỉ: ${order.state}, ${order.town}, ${order.address}, ${order.country}` }
              ],
              width: '*'
            },
            {
              stack: [
                { text: 'THÔNG TIN ĐƠN HÀNG', style: 'sectionHeader' },
                { text: `Phương thức thanh toán: ${this.getPaymentMethodLabel(order.paymentMethod)}` },
                { text: `Trạng thái thanh toán: ${this.getPaymentStatusLabel(order.paymentStatus)}` },
                { text: `Trạng thái đơn hàng: ${this.getOrderStatusLabel(order.orderStatus)}` },
                order.note ? { text: `Ghi chú: ${order.note}` } : { text: '' }
              ],
              width: '*'
            }
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20]
        },

        // Invoice Items
        { text: 'CHI TIẾT SẢN PHẨM', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto'],
            body: tableBody
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.body.length) ? 1 : 1;
            },
            vLineWidth: function () {
              return 1;
            },
            hLineColor: function (i: number) {
              return i === 0 || i === 1 ? '#aaaaaa' : '#aaaaaa';
            },
            vLineColor: function () {
              return '#aaaaaa';
            },
            paddingLeft: function (i: number) {
              return i === 0 ? 8 : 8;
            },
            paddingRight: function (i: number, node: any) {
              return (i === node.table.widths.length - 1) ? 8 : 8;
            },
            paddingTop: function () {
              return 8;
            },
            paddingBottom: function () {
              return 8;
            }
          }
        },

        // Footer
        {
          columns: [
            {
              text: 'Người mua hàng',
              alignment: 'center',
              margin: [0, 30, 0, 10]
            },
            {
              text: 'Người bán hàng',
              alignment: 'center',
              margin: [0, 30, 0, 10]
            }
          ]
        },
        {
          columns: [
            {
              text: '(Ký, ghi rõ họ tên)',
              alignment: 'center',
              italics: true,
              fontSize: 10
            },
            {
              text: '(Ký, ghi rõ họ tên)',
              alignment: 'center',
              italics: true,
              fontSize: 10
            }
          ]
        }
      ],
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.3
      },
      styles: {
        companyName: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        invoiceTitle: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        invoiceSubTitle: {
          fontSize: 12,
          margin: [0, 0, 0, 5]
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        tableHeader: {
          bold: true,
          fontSize: 12
        },
        tableFooter: {
          bold: true,
          fontSize: 12
        }
      },
      pageMargins: [40, 40, 40, 40]
    };
  }

  /**
   * Get payment method display label
   */
  private getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'COD': return 'Tiền mặt (COD)';
      case 'vnpay': return 'VNPay';
      default: return method || 'Không xác định';
    }
  }

  /**
   * Get payment status display label
   */
  private getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Đã thanh toán';
      case 'PENDING': return 'Chờ thanh toán';
      case 'CANCELLED': return 'Thanh toán thất bại';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status || 'Chờ thanh toán';
    }
  }

  /**
   * Get order status display label
   */
  private getOrderStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PREPARING': return 'Đang chuẩn bị';
      case 'SHIPPING': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'CANCELLED': return 'Đã hủy';
      default: return status || 'Chờ xác nhận';
    }
  }
}