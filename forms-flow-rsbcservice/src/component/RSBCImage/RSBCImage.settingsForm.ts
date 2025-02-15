import baseEditForm from "@aot-technologies/formiojs/lib/components/_classes/component/Component.form";

const settingsForm = (...extend) => {
  return baseEditForm(
    [
      {
        key: "display",
        components: [
          {
            type: "textfield",
            key: "label",
            label: "Label",
            input: true,
            weight: 10,
          },
          {
            type: "select",
            key: "stage",
            label: "RSBC Printing Stage",
            input: true,
            widget: "choicesjs",
            dataSrc: "values",
            data: {
              values: [
                { label: "Stage One", value: "stageOne" },
                { label: "Stage Two", value: "stageTwo" },
              ],
            },
            weight: 20,
            defaultValue: "stageOne",
            placeholder: "Select an RSBC Printing Stage",
            multiple: false,
            searchEnabled: false,
          },
          {
            type: "textarea",
            key: "rsbcImageSettings",
            label: "RSBC Image Settings (JSON format)",
            input: true,
            rows: 5,
            resizable: true,
            weight: 30,
            // editor: "ace",
            as: "json",
            validate: {
              custom: function (context) {
                // If empty or default to ""
                let currValue = context.data.rsbcImageSettings.trim();
                if (currValue === "" || currValue === '""') {
                  context.data.rsbcImageSettings = "";
                  return true;
                }
                try {
                  JSON.parse(context.value);
                  return true;
                } catch (error) {
                  return "Invalid JSON format";
                }
              },
            },
            description: `
                        Example JSON:<pre>
{
    "TwentyFourHour": "form1.data.twentyFourHour",
    "drivers_licence_jurisdiction": {
        "mapping": {
            "value": "form2.drivers_licence_jurisdiction_value",
            "label": "form2.drivers_licence_jurisdiction_label"
        }
    },
    "gender": { "default": {} },
    "driver_licence_expiry": { "default": null },
    "driver_licence_class": { "default": "A" },
    "vehicle_colour": {
        "mapping": {
            "0": "form1.vehicleColours"
        }
    }
}</pre>
                        `,
          },
        ],
      },
      {
        key: "data",
        components: [],
      },
      {
        key: "validation",
        components: [],
      },
      {
        key: "api",
        components: [],
      },
      {
        key: "conditional",
        components: [],
      },
      {
        key: "logic",
        components: [],
      },
    ],
    ...extend
  );
};

export default settingsForm;
