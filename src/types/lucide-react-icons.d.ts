declare module 'lucide-react/dist/esm/icons/square-pen' {
  import { FC, SVGProps } from 'react';
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }
  const Icon: FC<LucideProps>;
  export default Icon;
}
