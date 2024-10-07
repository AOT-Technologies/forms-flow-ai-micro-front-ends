import React, { useEffect } from "react";
import { StorageService } from "@formsflow/service";
import { MULTITENANCY_ENABLED } from "../constants/constants";

const TenantHeader = React.memo(({ props }) => {
  const [tenantLogo, setTenantLogo] = React.useState("");
  const [tenantName, setTenantName] = React.useState("");
  const [tenant, setTenant] = React.useState({});

  useEffect(() => { 
    props.subscribe("ES_TENANT", (msg, data) => {
      if (data) {
        setTenant(data);
        if (!JSON.parse(StorageService.get("TENANT_DATA"))?.name) {
          StorageService.save("TENANT_DATA", JSON.stringify(data.tenantData));
        }
      }
    });
  }, []);

  useEffect(() => {
    const data = JSON.parse(StorageService.get("TENANT_DATA"));
    if (MULTITENANCY_ENABLED && data?.details) {
      setTenantName(data?.details?.applicationTitle);
      const logo = data?.details?.customLogo?.logo;
      setTenantLogo(logo);
    }
  }, [tenant]);

  return (
    <div className="multitenancy-header">
      <img className="multitenancy-logo" src={tenantLogo} alt="custom logo" />
      <span className="multitenancy-app-name">{tenantName}</span>
    </div>
  );
});
export default TenantHeader;
