module.exports = {
    plugins: {
        "postcss-preset-mantine": {},
        "postcss-simple-vars": {
            variables: {
                "mantine-breakpoint-xs": "36em",
                "mantine-breakpoint-sm": "52em",
                "mantine-breakpoint-md": "66em",
                "mantine-breakpoint-lg": "74em",
                "mantine-breakpoint-xl": "90em",
            },
        },
    },
};