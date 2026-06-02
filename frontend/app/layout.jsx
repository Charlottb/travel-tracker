import './globals.css';

export const metadata = {
  title: 'Travel Tracker',
  description: 'Server-side Travel Tracker with Next.js and Tailwind',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
