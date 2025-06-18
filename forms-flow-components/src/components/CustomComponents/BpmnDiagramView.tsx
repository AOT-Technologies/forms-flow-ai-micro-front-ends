import React, {
  useCallback,
  useEffect, 
  useState, 
} from "react";
import BpmnJS from "bpmn-js/dist/bpmn-navigated-viewer.production.min.js";
import { useTranslation } from "react-i18next";

 

interface ProcessDiagramProps {
  diagramXML: string;
  activityId: string;
  isProcessDiagramLoading: boolean;
}

const ProcessDiagram: React.FC<ProcessDiagramProps> = React.memo(
  ({ diagramXML, activityId, isProcessDiagramLoading }) => {
    const { t } = useTranslation();
    const [bpmnViewer, setBpmnViewer] = useState<any>(null);

    const containerRef = useCallback((node: HTMLDivElement | null) => {
      if (node !== null) {
        const viewerInstance = new BpmnJS({ container: "#process-diagram-container" });
        setBpmnViewer(viewerInstance);
      }
    }, []);

    useEffect(() => {
      if (bpmnViewer) {
        bpmnViewer.on("import.done", (event: any) => {
          const { error } = event;
          if (error) {
            console.error("bpmnViewer error >", error);
          }
        });
      }

      return () => {
        if (bpmnViewer) {
          bpmnViewer.destroy();
        }
      };
    }, [bpmnViewer]);

    useEffect(() => {
      if (diagramXML && bpmnViewer) {
        bpmnViewer.importXML(diagramXML);
      }
    }, [diagramXML, bpmnViewer]);

    useEffect(() => {
      if (diagramXML && bpmnViewer && activityId) {
        setTimeout(() => {
          if (bpmnViewer?.get("canvas")) {
            bpmnViewer
              .get("canvas")
              .addMarker({ id: activityId }, "highlight");
          }
        }, 0);
      }
    }, [diagramXML, bpmnViewer, activityId]);

    const zoom = () => {
      bpmnViewer?.get("zoomScroll")?.stepZoom(1);
    };

    const zoomOut = () => {
      bpmnViewer?.get("zoomScroll")?.stepZoom(-1);
    };

    const zoomReset = () => {
      bpmnViewer?.get("zoomScroll")?.reset();
    };

    if (isProcessDiagramLoading) {
      return (
        <div className="bpmn-viewer-container">
          <div className="bpm-container">
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">{t("Loading...")}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (diagramXML === "") {
      return (
        <div className="bpmn-viewer-container">
          <div className="bpm-container">{t("No Process Diagram found")}</div>
        </div>
      );
    }

    return (
      <div>
        <div className="bpmn-viewer-container">
          <div
            id="process-diagram-container"
            className="bpm-container grab-cursor"
            ref={containerRef}
          />
        </div>
        <div className="d-flex justify-content-end">
          <div className="d-flex flex-column">
            <button className="mb-3" title="Reset Zoom" onClick={zoomReset}>
              <i className="fa fa-retweet" aria-hidden="true" />
            </button>
            <button title="Zoom In" onClick={zoom}>
              <i className="fa fa-search-plus" aria-hidden="true" />
            </button>
            <button title="Zoom Out" onClick={zoomOut}>
              <i className="fa fa-search-minus" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default ProcessDiagram;
