# PDF-Tron WebViewer BUG

---

## Install

1. Run `npm install` to install all dependencies
2. Run `node tools/copy-webviewer-files.js` to copy the webviewer files to 'src/assets'

---

## Run
- Run `ng serve` to start the dev server

---

## Bug

When rotating a **custom annotation** in the PDFTron WebViewer, the rotation is **not preserved correctly after exporting/downloading the PDF**.

Inside the WebViewer, the annotation appears correctly rotated.
However, **after downloading the PDF, the annotation ends up with a random rotation**, not matching either the original position or the rotation applied in the viewer.

The rotation logic was implemented exactly as instructed by PDFTron (Apryse) in their support ticket:
[https://support.apryse.com/support/tickets/129057](https://support.apryse.com/support/tickets/129057)

### Observed Behavior

```
- Rotate a custom annotation in WebViewer → displays correctly
- Export or download the PDF
- The annotation in the exported PDF appears with a random rotation (not matching the intended rotation)
```

### Expected Behavior

```
The rotation applied to a custom annotation in the WebViewer
should be preserved exactly and consistently in the downloaded PDF.
```

*The WebViewer logic can be found in `src/webviewer/web-viewer.component.ts`
