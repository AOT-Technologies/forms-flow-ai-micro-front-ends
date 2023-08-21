import "./style-classes/global.css?modules=false";
import dashboardCss from './style-classes/dashboard.scss';
import pagenotfound from './style-classes/pagenotfound.scss';
import base from './style-classes/base.scss';
import footer from './style-classes/footer.scss';
import loading from './style-classes/loading.scss';
import layouts from './style-classes/layouts.scss';
import application from './style-classes/application.scss';
import ServiceFlow from './style-classes/ServiceFlow.scss';
import bpm from './style-classes/bpm.scss';
import List from './style-classes/List.scss';
import styles from './style-classes/styles.scss';
import nodata from './style-classes/nodata.scss';
import Editor from './style-classes/Editor.scss';
import stepper from './style-classes/Stepper.scss';
import Modeler from './style-classes/Modeler.scss';
import Insights from './style-classes/Insights.scss';
import loadError from './style-classes/LoadError.scss';
import TaskDetail from './style-classes/TaskDetail.scss';

export {
    application,
    base,
    bpm,
    dashboardCss,
    Editor,
    footer,
    Insights,
    layouts,
    loading,
    loadError,
    List,
    Modeler,
    nodata,
    pagenotfound,
    ServiceFlow,
    stepper,
    styles,
    TaskDetail
};

export function publicApiFunction() { }
