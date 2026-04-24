import {
  CustomerField,
  FormattedCustomersTable,
  InvoiceForm,
  InvoicesTable,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { customers, invoices, revenue } from './placeholder-data';

export async function fetchRevenue(): Promise<Revenue[]> {
  return revenue;
}

export async function fetchLatestInvoices() {
  const latestInvoices = invoices
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((invoice) => {
      const customer = customers.find((c) => c.id === invoice.customer_id)!;
      return {
        id: invoice.customer_id + invoice.date,
        name: customer.name,
        image_url: customer.image_url,
        email: customer.email,
        amount: formatCurrency(invoice.amount),
      };
    });
  return latestInvoices;
}

export async function fetchCardData() {
  const numberOfInvoices = invoices.length;
  const numberOfCustomers = customers.length;
  const totalPaidInvoices = formatCurrency(
    invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0),
  );
  const totalPendingInvoices = formatCurrency(
    invoices
      .filter((i) => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0),
  );
  return {
    numberOfCustomers,
    numberOfInvoices,
    totalPaidInvoices,
    totalPendingInvoices,
  };
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
): Promise<InvoicesTable[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const q = query.toLowerCase();

  const filtered = invoices
    .map((invoice) => {
      const customer = customers.find((c) => c.id === invoice.customer_id)!;
      return {
        id: invoice.customer_id + invoice.date,
        customer_id: invoice.customer_id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
        date: invoice.date,
        amount: invoice.amount,
        status: invoice.status as 'pending' | 'paid',
      };
    })
    .filter(
      (inv) =>
        inv.name.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q) ||
        String(inv.amount).includes(q) ||
        inv.date.includes(q) ||
        inv.status.includes(q),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return filtered.slice(offset, offset + ITEMS_PER_PAGE);
}

export async function fetchInvoicesPages(query: string): Promise<number> {
  const q = query.toLowerCase();
  const count = invoices
    .map((invoice) => {
      const customer = customers.find((c) => c.id === invoice.customer_id)!;
      return { ...invoice, name: customer.name, email: customer.email };
    })
    .filter(
      (inv) =>
        inv.name.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q) ||
        String(inv.amount).includes(q) ||
        inv.date.includes(q) ||
        inv.status.includes(q),
    ).length;
  return Math.ceil(count / ITEMS_PER_PAGE);
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm | undefined> {
  const invoice = invoices.find(
    (inv) => inv.customer_id + inv.date === id,
  );
  if (!invoice) return undefined;
  return {
    id: invoice.customer_id + invoice.date,
    customer_id: invoice.customer_id,
    amount: invoice.amount / 100,
    status: invoice.status as 'pending' | 'paid',
  };
}

export async function fetchCustomers(): Promise<CustomerField[]> {
  return customers
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchFilteredCustomers(query: string): Promise<FormattedCustomersTable[]> {
  const q = query.toLowerCase();
  return customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    )
    .map((customer) => {
      const customerInvoices = invoices.filter(
        (inv) => inv.customer_id === customer.id,
      );
      const total_invoices = customerInvoices.length;
      const total_pending = formatCurrency(
        customerInvoices
          .filter((i) => i.status === 'pending')
          .reduce((sum, i) => sum + i.amount, 0),
      );
      const total_paid = formatCurrency(
        customerInvoices
          .filter((i) => i.status === 'paid')
          .reduce((sum, i) => sum + i.amount, 0),
      );
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
        total_invoices,
        total_pending,
        total_paid,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
