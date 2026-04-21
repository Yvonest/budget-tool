import { toJpeg } from 'html-to-image';

export async function exportElementToJpg(
  el: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await toJpeg(el, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#F8F2E7',
    cacheBust: true,
    filter: (node) => {
      if (node instanceof HTMLElement && node.dataset?.exportHide === 'true') {
        return false;
      }
      return true;
    },
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
