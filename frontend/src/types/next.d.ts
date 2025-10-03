declare module 'next/image' {
  import { ComponentProps } from 'react';
  
  interface ImageProps extends ComponentProps<'img'> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    unoptimized?: boolean;
    loader?: (props: { src: string; width: number; quality?: number }) => string;
    sizes?: string;
    className?: string;
  }
  
  const Image: React.FC<ImageProps>;
  export default Image;
}
