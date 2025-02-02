import baseEditForm from "@aot-technologies/formiojs/lib/components/_classes/component/Component.form";

const settingsForm = (...extend) => {
    return baseEditForm(
        [
            {
                key: "display",
                components: [
                    {
                        type: 'textfield',
                        key: 'label',
                        label: 'Label',
                        input: true,
                        weight: 10,
                    },
                    {
                        type: 'select',
                        key: 'stage',
                        label: 'RSBC Printing Stage',
                        input: true,
                        widget: 'choicesjs',
                        dataSrc: 'values',
                        data: {
                            values: [
                                { label: 'Stage One', value: 'stageOne' },
                                { label: 'Stage Two', value: 'stageTwo' },
                            ],
                        },
                        weight: 20,
                        defaultValue: 'stageOne',
                        placeholder: 'Select an RSBC Printing Stage',
                        multiple: false,
                        searchEnabled: false,
                    },
                ],
            },
            {
                key: "data",
                components: [ ],
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
