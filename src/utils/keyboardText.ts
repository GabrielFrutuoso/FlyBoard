import {
    accentFor,
    FN_MAP,
    isAccentBase,
    isCharKey,
    shifted,
    type Layout,
} from "../keys";

const isLetter = (key: string) => /^[a-z]$/.test(key);

export const getKeyLabel = (
    key: string,
    shiftActive: boolean,
    capsActive: boolean,
    layout: Layout,
) => {
    if (!isCharKey(key)) return key;
    if (isLetter(key))
        return shiftActive !== capsActive ? key.toUpperCase() : key;
    return shiftActive ? shifted(key, layout) : key;
};

export const resolveKey = (key: string, fnActive: boolean, layout: Layout) =>
    fnActive && FN_MAP[layout]?.[key] ? FN_MAP[layout][key] : key;

export const deadKeyMark = (key: string, layout: Layout) => {
    if (layout !== "pt-br") return undefined;
    return (
        {
            "´": "\u0301",
            "`": "\u0300",
            "~": "\u0303",
            "^": "\u0302",
        }[key] ?? undefined
    );
};

export const composeDeadKey = (deadKey: string, mark: string, text: string) => {
    if (text === " ") return deadKey;
    const marked = `${text}${mark}`;
    const composed = marked.normalize("NFC");
    return composed === marked ? `${deadKey}${text}` : composed;
};

export const isValidAccentBase = (pendingKey: string, label: string) => {
    const pendingAccent = accentFor(pendingKey);
    return pendingAccent ? isAccentBase(pendingAccent, label) : true;
};