import React from "react";
import "./pagenotfound.scss";

// Define prop types
interface NotFoundProps {
  errorMessage?: string;
  errorCode?: string;
}

// React.memo with typed props
const NotFound: React.FC<NotFoundProps> = React.memo(
  ({ errorMessage = "Page Not Found", errorCode = "404" }) => {
    return (
      <section>
        <div className="circles">
          <p>
            {errorCode}
            <br />
            <small>{errorMessage}</small>
          </p>
          <span className="circle big" />
          <span className="circle med" />
          <span className="circle small" />
        </div>
      </section>
    );
  }
);

export default NotFound;