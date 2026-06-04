declare module 'piexifjs' {
  export const GPSIFD: any;
  export const ImageIFD: any;
  export const ExifIFD: any;
  export const GPSHelper: any;
  export function dump(exifObj: any): string;
  export function insert(exifStr: string, jpegData: string): string;
  export function remove(jpegData: string): string;
  export function load(jpegData: string): any;
}
