import {AfterViewInit, Component, ElementRef, ViewChild} from "@angular/core";
import WebViewer, {WebViewerInstance} from "@pdftron/webviewer";

@Component({
  selector: 'web-viewer',
  template: `<div #viewer class="viewer"></div>`,
  standalone: true,
})
export class WebViewerComponent implements AfterViewInit {
  private instance!: WebViewerInstance;

  @ViewChild('viewer') viewerElement!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    this.initWebViewer();
  }

  private async initWebViewer() {
    this.instance = await WebViewer.WebComponent(
      {
        css: 'assets/overrides.css',
        annotationUser: 'Test User',
        documentXFDFRetriever: () => new Promise<string>((resolve) => resolve('')),
        enableMeasurement: true,
        fullAPI: true,
        initialDoc: '',
        licenseKey: '',
        ui: 'beta',
        path: 'assets/pdftron-lib',
        additionalTranslations: {
          language: 'de',
          translations: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            'option.toolbarGroup.toolbarGroup-Forms': 'Formular',
          },
        },
      },
      this.viewerElement.nativeElement,
    );

    const MyCustomAnnotation = await this.initPdfViewer();

    this.instance.Core.documentViewer.addEventListener('documentLoaded', () => {
      // insert custom annotation after document is loaded
      const { Annotations, annotationManager, documentViewer } = this.instance.Core;

      const customAnnot = new MyCustomAnnotation();
      customAnnot.PageNumber = 1;
      customAnnot.X = 100;
      customAnnot.Y = 100;
      customAnnot.Width = 200;
      customAnnot.Height = 100;

      annotationManager.addAnnotation(customAnnot);
      annotationManager.redrawAnnotation(customAnnot);
      documentViewer.updateView();
    });

    this.instance.Core.documentViewer.loadDocument('assets/test.pdf');
  }

  private async initPdfViewer() {
    const { Annotations, annotationManager } = this.instance.Core;

    const CustomAnnotationName = 'MyCustomAnnotation';

    class MyCustomAnnotation extends Annotations.CustomAnnotation {
      constructor() {
        super(CustomAnnotationName);
        this.Subject = CustomAnnotationName;
        this.RotationControlEnabled = true;
        // @ts-expect-error see pdftron ticket https://support.apryse.com/support/tickets/129057
        this.selectionModel = class CustomSelectionModel extends Annotations.BoxSelectionModel {
          constructor(annotation: unknown, canModify: boolean, isSelected = false, documentViewer?: unknown) {
            // @ts-expect-error see pdftron ticket https://support.apryse.com/support/tickets/129057
            super(annotation, canModify, isSelected, documentViewer);
            this.getControlHandles().push(
              // @ts-expect-error see pdftron ticket https://support.apryse.com/support/tickets/129057
              new Annotations.RotationControlHandle(15, 15, 30, annotation, documentViewer),
            );
          }
        }
      }

      public override draw(ctx: CanvasRenderingContext2D, pageMatrix: unknown): void {
        super.draw(ctx, pageMatrix);

        // @ts-expect-error see pdftron ticket https://support.apryse.com/support/tickets/129057
        const { x, y, height, width } = this.getUnrotatedDimensions();

        // @ts-expect-error see pdftron ticket https://support.apryse.com/support/tickets/129057
        const radians = Annotations.RotationUtils.getRotationAngleInRadiansByDegrees(this.Rotation);

        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(-radians);
        ctx.translate(-(x + width / 2), -(y + height / 2));

        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);

        ctx.restore();
      }
    }

    MyCustomAnnotation.prototype.elementName = CustomAnnotationName;
    annotationManager.registerAnnotationType(CustomAnnotationName, MyCustomAnnotation as never);

    // @ts-expect-error see pdftron ticket https://support.apryse.com/support/tickets/129057
    const mixin = Annotations.RotationUtils.RectangularCustomAnnotationRotationMixin;
    const { rotate, getUnrotatedDimensions, getRotatedAnnotationBoundingBoxRect } = mixin;
    const ownSerialize = MyCustomAnnotation.prototype.serialize;
    const ownDeserialize = MyCustomAnnotation.prototype.deserialize;

    Object.assign(MyCustomAnnotation.prototype, { rotate, getRotatedAnnotationBoundingBoxRect, getUnrotatedDimensions });
    MyCustomAnnotation.prototype.serialize = function (element: Element, pageMatrix: unknown): Element {
      const newElement = ownSerialize.call(this, element, pageMatrix);
      const serialized = mixin.serialize.call(this, newElement, pageMatrix);

      return serialized;
    };
    MyCustomAnnotation.prototype.deserialize = async function (element: Element, pageMatrix: unknown): Promise<void> {
      await mixin.deserialize.call(this, element, pageMatrix);
      ownDeserialize.call(this, element, pageMatrix);
    };

    return MyCustomAnnotation
  }
}

