import React from "react";
import { Translation } from "react-i18next";

const Head = React.memo((props: any) => {
  const { items, page , hideLine=false } = props;
  return (
    <div className="header-container" data-testid="header-container">
      <div className="main-header">
        {items?.map((item, key) => (
          <div
            key={key}
            className={`head-item ${item.name === page ? "head-active" : ""} ${
              key > 0 ? "padding-left-60" : ""
            }`}
            data-testid={`head-item-${key}`}
          >
            <h3 onClick={item?.onClick} className="application-head">
              <i
                className={`fa fa-${item?.icon}`}
                style={{ marginTop: "5px" }}
                aria-hidden="true"
                data-testid={`head-icon-${key}`}
              />
              <span
                className="application-text"
                data-testid={`application-text-${key}`}
              >
                <Translation>{(t) => t(item?.name)}</Translation>
              </span>
              {item?.count ? (
                <div
                  className="application-count"
                  role="contentinfo"
                  data-testid={`application-count-${key}`}
                >
                  ({item?.count})
                </div>
              ) : null}
            </h3>
          </div>
        ))}
      </div>
     {!hideLine ? <hr className="head-rule " data-testid="head-rule" /> : null } 
    </div>
  );
});

export default Head;
