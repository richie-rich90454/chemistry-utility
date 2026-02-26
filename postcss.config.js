import cssnano from "cssnano";

export default {
    plugins: [
        cssnano({
            preset: [
                "advanced",
                {
                    autoprefixer: false,
                    discardComments: {
                        removeAll: true,
                    },
                    normalizeWhitespace: true,
                    colormin: true,
                    convertValues: true,
                    mergeLonghand: true,
                    mergeRules: true,
                    minifyFontValues: true,
                    minifyGradients: true,
                    minifyParams: true,
                    minifySelectors: true,
                    normalizeUrl: true,
                    orderedValues: true,
                    reduceIdents: {
                        keyframes: false,
                    },
                    reduceTransforms: true,
                    svgo: true,
                    uniqueSelectors: true,
                    discardDuplicates: true,
                    discardEmpty: true,
                    discardOverridden: true,
                    mergeIdents: true,
                    mergeMedia: true,
                    zindex: false,
                },
            ],
        }),
    ],
};