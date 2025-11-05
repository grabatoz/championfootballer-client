import { AppProps } from 'next/app';
import ToasterProvider from '@/Components/ToasterProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <ToasterProvider />
    </>
  );
}