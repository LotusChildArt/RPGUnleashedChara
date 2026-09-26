const SHARED_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/sharedCharacters";


const REMOVED_PARTY_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/removedPartyCharacters";


const ROOM_SHARED_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/roomSharedCharactersV2";


const LIVE_SHEET_CHANNEL =
    "com.rpgunleashed.character-sheet/liveSheetV1";


const TOKEN_HUD_METADATA_KEY =
    "com.rpgunleashed.character-sheet/tokenHud";


const TOKEN_CONDITION_METADATA_KEY =
    "com.rpgunleashed.character-sheet/tokenCondition";


const TOKEN_LINK_METADATA_KEY =
    "com.rpgunleashed.character-sheet/tokenLink";


const CONDITION_OVERLAY_ASSETS = {
    "fear": "/assets/conditions/fear.png",
    "wounded": "/assets/conditions/wounded.png",
    "arrowed": "/assets/conditions/arrowed.png",
    "bleeding": "/assets/conditions/bleeding.png",
    "broken-bone": "/assets/conditions/broken-bone.png",
    "burning": "/assets/conditions/burning.png",
    "charmed": "/assets/conditions/charmed.png",
    "poisoned": "/assets/conditions/poisoned.png",
    "drunk": "/assets/conditions/drunk.png",
    "confused": "/assets/conditions/confused.png",
    "frozen": "/assets/conditions/frozen.png",
    "unconscious": "/assets/conditions/unconscious.png",
    "taunted": "/assets/conditions/taunted.png",
    "shocked": "/assets/conditions/shocked.png",
    "stunned": "/assets/conditions/stunned.png"
};


const CONDITION_ASSET_WIDTH =
    1516;


const CONDITION_ASSET_HEIGHT =
    1536;


const TOKEN_HUD_ASSETS = {
    hpStates:
        "/assets/tokenhud/hp/",
    manaStates:
        "/assets/tokenhud/mana/",
    drIcon:
        "/assets/tokenhud/dr-icon.png",
    nlIcon:
        "/assets/tokenhud/nl-icon.png"
};


const TOKEN_HUD_BAR_WIDTH =
    300;


const TOKEN_HUD_BAR_HEIGHT =
    40;


const TOKEN_HUD_ICON_WIDTH =
    72;


const TOKEN_HUD_ICON_HEIGHT =
    63;


const CONDITION_DEFINITIONS = [
    {
        id: "fear",
        name: "Fear",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "wounded",
        name: "Acid",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "arrowed",
        name: "Arrowed",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "bleeding",
        name: "Bleeding",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "broken-bone",
        name: "Broken Bone",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "burning",
        name: "Burning",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "charmed",
        name: "Charmed",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "poisoned",
        name: "Dead",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "drunk",
        name: "Drunk",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "confused",
        name: "Unconscious",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "frozen",
        name: "Frozen",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "unconscious",
        name: "Poisoned",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "taunted",
        name: "Taunted",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "shocked",
        name: "Shocked",
        description: "No rules text has been set for this condition yet."
    },
    {
        id: "stunned",
        name: "Stunned",
        description: "No rules text has been set for this condition yet."
    }
];


function getConditionDefinition(
    conditionId
) {

    return CONDITION_DEFINITIONS.find(
        definition =>
            definition.id ===
            conditionId
    ) || null;

}


const TRANSFER_CHUNK_BYTES =
    7000;


const TRANSFER_TIMEOUT_MS =
    20000;


const isBackgroundContext =
    new URLSearchParams(
        window.location.search
    ).get(
        "owlbearBackground"
    ) ===
    "1";


function cleanSharedCharacters(
    value
) {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];

    }


    return value.filter(
        character =>
            character &&
            typeof character ===
            "object"
    );

}


function cleanRemovedPartyCharacters(
    value
) {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];

    }


    return value.filter(
        key =>
            typeof key ===
            "string"
    );

}


function partyCharacterKey(
    ownerId,
    characterId
) {

    return String(
        ownerId ||
        ""
    ) +
    "::" +
    String(
        characterId ||
        ""
    );

}


function numericFieldValue(field) {
    if (!field) return 0;
    const raw = field.value || field.getAttribute("value") || "0";
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
}

function getVitalsFromCharacterRecord(character) {
    const vitals = {
        hpCurrent: 0,
        hpMax: 0,
        nl: 0,
        drArmor: 0,
        drNatural: 0,
        drMagic: 0,
        manaCurrent: 0,
        manaMax: 0
    };

    const tab1Html = character?.state?.tabs?.tab1;
    if (typeof tab1Html === "string") {
        const template = document.createElement("template");
        template.innerHTML = tab1Html;
        const hpInputs = template.content.querySelectorAll(
            ".current-max-field .current-max-values input"
        );
        vitals.hpCurrent = numericFieldValue(hpInputs[0]);
        vitals.hpMax = numericFieldValue(hpInputs[1]);
        vitals.nl = numericFieldValue(
            template.content.querySelector(".nl-field input")
        );
        const drInputs = template.content.querySelectorAll(".dr-bubbles input");
        vitals.drArmor = numericFieldValue(drInputs[0]);
        vitals.drNatural = numericFieldValue(drInputs[1]);
        vitals.drMagic = numericFieldValue(drInputs[2]);
    }

    const tab5Html = character?.state?.tabs?.tab5;
    if (typeof tab5Html === "string") {
        const template = document.createElement("template");
        template.innerHTML = tab5Html;
        const manaCurrent =
            template.content.querySelector(
                ".mana-current"
            );

        const manaMax =
            template.content.querySelector(
                ".mana-max"
            );

        const legacyManapool =
            template.content.querySelector(
                'input[placeholder="Manapool"]'
            );

        if (manaCurrent || manaMax) {
            vitals.manaCurrent =
                numericFieldValue(
                    manaCurrent
                );

            vitals.manaMax =
                numericFieldValue(
                    manaMax
                );
        }

        else if (legacyManapool) {
            const legacyMana =
                numericFieldValue(
                    legacyManapool
                );

            vitals.manaCurrent =
                legacyMana;

            vitals.manaMax =
                legacyMana;
        }
    }

    return vitals;
}

function getConditionsFromCharacterRecord(
    character
) {

    const tab1Html =
        character?.state?.tabs?.tab1;


    if (
        typeof tab1Html !==
        "string"
    ) {

        return [];

    }


    const template =
        document.createElement(
            "template"
        );


    template.innerHTML =
        tab1Html;


    return Array.from(
        template.content.querySelectorAll(
            ".condition-card"
        )
    )
    .map(
        card => {

            const id =
                card.dataset.conditionId ||
                "";


            const raw =
                card.querySelector(
                    ".condition-stacks"
                )?.value ||
                card.querySelector(
                    ".condition-stacks"
                )?.getAttribute(
                    "value"
                ) ||
                "1";


            const stacks =
                Number(
                    raw
                );


            return {
                id,
                stacks:
                    Number.isFinite(
                        stacks
                    )
                        ? Math.max(
                            1,
                            Math.floor(
                                stacks
                            )
                        )
                        : 1
            };

        }
    )
    .filter(
        condition =>
            Boolean(
                CONDITION_OVERLAY_ASSETS[
                    condition.id
                ]
            )
    );

}


function normalizeVitals(vitals) {
    const num = key => {
        const value = Number(vitals?.[key] ?? 0);
        return Number.isFinite(value) ? value : 0;
    };
    return {
        hpCurrent: num("hpCurrent"),
        hpMax: num("hpMax"),
        nl: num("nl"),
        drArmor: num("drArmor"),
        drNatural: num("drNatural"),
        drMagic: num("drMagic"),
        manaCurrent: num("manaCurrent"),
        manaMax: num("manaMax")
    };
}

function makeTokenHudSecondaryText(vitals) {
    const values = normalizeVitals(vitals);
    const parts = [];

    if (values.nl > 0) {
        parts.push(
            `${values.nl} NL`
        );
    }

    const totalDr =
        values.drArmor +
        values.drNatural +
        values.drMagic;

    if (totalDr > 0) {
        parts.push(
            `DR ${totalDr}`
        );
    }

    return parts.join(
        "   "
    );
}


function makeTextBar(current, maximum, segments = 12) {
    if (maximum <= 0) {
        return "";
    }

    const fraction =
        Math.max(
            0,
            Math.min(
                1,
                current / maximum
            )
        );

    const filled =
        Math.round(
            fraction * segments
        );

    return (
        "[" +
        "#".repeat(filled) +
        "-".repeat(segments - filled) +
        "]"
    );
}


function makeTokenHudText(vitals) {
    const values =
        normalizeVitals(vitals);

    const lines = [];

    if (
        values.hpMax > 0 ||
        values.hpCurrent > 0
    ) {
        lines.push(
            "HP " +
            makeTextBar(
                values.hpCurrent,
                values.hpMax
            )
        );
    }

    if (
        values.manaMax > 0 ||
        values.manaCurrent > 0
    ) {
        lines.push(
            "Mana " +
            makeTextBar(
                values.manaCurrent,
                values.manaMax
            )
        );
    }

    const secondary =
        makeTokenHudSecondaryText(
            values
        );

    if (secondary) {
        lines.push(
            secondary
        );
    }

    return lines.join(
        "\n"
    );
}


function getHudItemIdsFromLink(link) {
    const ids = [];

    if (
        Array.isArray(
            link?.hudItemIds
        )
    ) {
        ids.push(
            ...link.hudItemIds.filter(Boolean)
        );
    }

    if (
        link?.labelId
    ) {
        ids.push(
            link.labelId
        );
    }

    return Array.from(
        new Set(ids)
    );
}


function getRoomTokenLink(character, roomId) {
    const links = character?.owlbearTokenLinks;
    if (!links || typeof links !== "object") return null;
    const link = links[roomId];
    return link && typeof link === "object" ? link : null;
}

function makeTransferId() {

    if (
        window.crypto?.randomUUID
    ) {

        return window.crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2)
    );

}


function bytesToBase64(
    bytes
) {

    let binary =
        "";


    for (
        let index = 0;
        index < bytes.length;
        index += 1
    ) {

        binary +=
            String.fromCharCode(
                bytes[index]
            );

    }


    return btoa(
        binary
    );

}


function base64ToBytes(
    value
) {

    const binary =
        atob(
            value
        );


    const bytes =
        new Uint8Array(
            binary.length
        );


    for (
        let index = 0;
        index < binary.length;
        index += 1
    ) {

        bytes[index] =
            binary.charCodeAt(
                index
            );

    }


    return bytes;

}


function serializeToChunks(
    value
) {

    const bytes =
        new TextEncoder()
            .encode(
                JSON.stringify(
                    value
                )
            );


    const chunks =
        [];


    for (
        let offset = 0;
        offset < bytes.length;
        offset += TRANSFER_CHUNK_BYTES
    ) {

        chunks.push(
            bytesToBase64(
                bytes.slice(
                    offset,
                    offset +
                    TRANSFER_CHUNK_BYTES
                )
            )
        );

    }


    return chunks.length
        ? chunks
        : [
            bytesToBase64(
                new Uint8Array()
            )
        ];

}


function deserializeChunks(
    chunks
) {

    const byteChunks =
        chunks.map(
            base64ToBytes
        );


    const length =
        byteChunks.reduce(
            (
                total,
                chunk
            ) =>
                total +
                chunk.length,
            0
        );


    const bytes =
        new Uint8Array(
            length
        );


    let offset =
        0;


    byteChunks.forEach(
        chunk => {

            bytes.set(
                chunk,
                offset
            );


            offset +=
                chunk.length;

        }
    );


    const json =
        new TextDecoder()
            .decode(
                bytes
            );


    return JSON.parse(
        json
    );

}


function stripCharacterPictureFromTab(
    html
) {

    if (
        typeof html !==
        "string"
    ) {

        return html;

    }


    const template =
        document.createElement(
            "template"
        );


    template.innerHTML =
        html;


    const preview =
        template.content
            .querySelector(
                "#character-picture-preview"
            );


    if (
        preview
    ) {

        preview.textContent =
            "Character picture stays on the owner's device";

    }


    return template.innerHTML;

}


function makeTransferRecord(
    record
) {

    const copy =
        structuredClone(
            record
        );


    copy.portrait =
        "";


    if (
        copy.state?.tabs?.tab4
    ) {

        copy.state.tabs.tab4 =
            stripCharacterPictureFromTab(
                copy.state.tabs.tab4
            );

    }


    return copy;

}


function preserveOwnerPicture(
    incomingRecord,
    currentRecord
) {

    const next =
        structuredClone(
            incomingRecord
        );


    next.portrait =
        currentRecord.portrait ||
        "";


    next.owlbearTokenLinks =
        currentRecord.owlbearTokenLinks ||
        {};


    next.owlbearSharedRooms =
        currentRecord.owlbearSharedRooms ||
        {};


    const incomingTab =
        next.state?.tabs?.tab4;


    const currentTab =
        currentRecord.state?.tabs?.tab4;


    if (
        typeof incomingTab ===
            "string" &&
        typeof currentTab ===
            "string"
    ) {

        const incomingTemplate =
            document.createElement(
                "template"
            );


        const currentTemplate =
            document.createElement(
                "template"
            );


        incomingTemplate.innerHTML =
            incomingTab;


        currentTemplate.innerHTML =
            currentTab;


        const incomingPreview =
            incomingTemplate.content
                .querySelector(
                    "#character-picture-preview"
                );


        const currentPreview =
            currentTemplate.content
                .querySelector(
                    "#character-picture-preview"
                );


        if (
            incomingPreview &&
            currentPreview
        ) {

            incomingPreview.innerHTML =
                currentPreview.innerHTML;

        }


        next.state.tabs.tab4 =
            incomingTemplate.innerHTML;

    }


    return next;

}



let owlbearInitializationPromise =
    null;


function waitForOwlbearRetry(
    milliseconds
) {

    return new Promise(
        resolve => {

            window.setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


async function loadOwlbearSdk() {

    const sources = [
        "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk/+esm",
        "https://esm.sh/@owlbear-rodeo/sdk"
    ];


    let lastError =
        null;


    for (
        let attempt = 0;
        attempt < 6;
        attempt += 1
    ) {

        const source =
            sources[
                attempt %
                sources.length
            ];


        try {

            return await import(
                source +
                (
                    attempt ===
                    0
                        ? ""
                        : (
                            source.includes(
                                "?"
                            )
                                ? "&"
                                : "?"
                        ) +
                        "rpgRetry=" +
                        Date.now()
                )
            );

        }

        catch (
            error
        ) {

            lastError =
                error;


            window.dispatchEvent(
                new CustomEvent(
                    "rpg-owlbear-connection-state",
                    {
                        detail: {
                            state:
                                "retrying",
                            attempt:
                                attempt +
                                1
                        }
                    }
                )
            );


            await waitForOwlbearRetry(
                700 +
                (
                    attempt *
                    500
                )
            );

        }

    }


    throw (
        lastError ||
        new Error(
            "Could not load the Owlbear Rodeo SDK."
        )
    );

}


async function initializeOwlbear() {

    if (
        window.RPGOwlbear?.ready
    ) {

        return;

    }


    if (
        owlbearInitializationPromise
    ) {

        return owlbearInitializationPromise;

    }


    owlbearInitializationPromise =
        (async () => {

    try {

        const sdkModule =
            await loadOwlbearSdk();


        const OBR =
            sdkModule.default;


        if (
            !OBR ||
            !OBR.isAvailable
        ) {

            return;

        }


        OBR.onReady(
            async () => {

                try {

                    const [
                        playerName,
                        playerRole,
                        playerConnectionId
                    ] =
                        await Promise.all([
                            OBR.player.getName(),
                            OBR.player.getRole(),
                            OBR.player.getConnectionId()
                        ]);


                    const roomId =
                        OBR.room.id;


                    const buildLabel = sdkModule.buildLabel;
                    const buildImage = sdkModule.buildImage;
                    const buildText = sdkModule.buildText;


                    if (
                        isBackgroundContext
                    ) {

                        try {

                            await setupConditionsContextMenu();

                        }

                        catch (
                            error
                        ) {

                            console.error(
                                "Could not register RPG Unleashed context menu:",
                                error
                            );

                        }

                    }

                    function hasCharacterTokenLink(character) {
                        return Boolean(
                            getRoomTokenLink(
                                character,
                                roomId
                            )
                        );
                    }


                    async function setTokenLinkMetadata(
                        tokenId,
                        characterId,
                        ownerId = OBR.player.id
                    ) {

                        if (
                            !tokenId ||
                            !characterId ||
                            !(await OBR.scene.isReady())
                        ) {

                            return;

                        }


                        await OBR.scene.items.updateItems(
                            [
                                tokenId
                            ],
                            items => {

                                for (
                                    const item
                                    of items
                                ) {

                                    item.metadata =
                                        item.metadata ||
                                        {};


                                    item.metadata[
                                        TOKEN_LINK_METADATA_KEY
                                    ] = {
                                        characterId,
                                        ownerId,
                                        roomId,
                                        tokenId,
                                        linkedAt:
                                            Date.now()
                                    };

                                }

                            }
                        );

                    }


                    async function clearTokenLinkMetadata(
                        tokenId,
                        characterId = null,
                        ownerId = OBR.player.id
                    ) {

                        if (
                            !tokenId ||
                            !(await OBR.scene.isReady())
                        ) {

                            return;

                        }


                        await OBR.scene.items.updateItems(
                            [
                                tokenId
                            ],
                            items => {

                                for (
                                    const item
                                    of items
                                ) {

                                    const linkMeta =
                                        item.metadata?.[
                                            TOKEN_LINK_METADATA_KEY
                                        ];


                                    if (
                                        !linkMeta
                                    ) {

                                        continue;

                                    }


                                    if (
                                        characterId &&
                                        linkMeta.characterId !==
                                            characterId
                                    ) {

                                        continue;

                                    }


                                    if (
                                        ownerId &&
                                        linkMeta.ownerId !==
                                            ownerId
                                    ) {

                                        continue;

                                    }


                                    delete item.metadata[
                                        TOKEN_LINK_METADATA_KEY
                                    ];

                                }

                            }
                        );

                    }


                    async function repairLocalTokenLinks() {

                        if (
                            !(await OBR.scene.isReady())
                        ) {

                            return;

                        }


                        const localCharacters =
                            await getLocalCharacters();


                        if (
                            !localCharacters.length
                        ) {

                            return;

                        }


                        const characterById =
                            new Map(
                                localCharacters.map(
                                    character => [
                                        character.id,
                                        character
                                    ]
                                )
                            );


                        const sceneItems =
                            await OBR.scene.items.getItems();


                        const tokenById =
                            new Map(
                                sceneItems
                                    .filter(
                                        item =>
                                            item.layer ===
                                            "CHARACTER"
                                    )
                                    .map(
                                        item => [
                                            item.id,
                                            item
                                        ]
                                    )
                            );


                        const recovered =
                            new Map();


                        sceneItems.forEach(
                            item => {

                                const directMeta =
                                    item.layer ===
                                        "CHARACTER"
                                        ? item.metadata?.[
                                            TOKEN_LINK_METADATA_KEY
                                        ]
                                        : null;


                                const hudMeta =
                                    item.metadata?.[
                                        TOKEN_HUD_METADATA_KEY
                                    ];


                                const conditionMeta =
                                    item.metadata?.[
                                        TOKEN_CONDITION_METADATA_KEY
                                    ];


                                const meta =
                                    directMeta ||
                                    hudMeta ||
                                    conditionMeta;


                                if (
                                    !meta?.characterId ||
                                    meta.roomId !==
                                        roomId ||
                                    !meta.tokenId
                                ) {

                                    return;

                                }


                                if (
                                    !characterById.has(
                                        meta.characterId
                                    ) ||
                                    !tokenById.has(
                                        meta.tokenId
                                    )
                                ) {

                                    return;

                                }


                                recovered.set(
                                    meta.characterId,
                                    meta.tokenId
                                );

                            }
                        );


                        for (
                            const character
                            of localCharacters
                        ) {

                            const existingLink =
                                getRoomTokenLink(
                                    character,
                                    roomId
                                );


                            let tokenId =
                                existingLink?.tokenId ||
                                recovered.get(
                                    character.id
                                ) ||
                                null;


                            if (
                                !tokenId ||
                                !tokenById.has(
                                    tokenId
                                )
                            ) {

                                continue;

                            }


                            await setTokenLinkMetadata(
                                tokenId,
                                character.id,
                                OBR.player.id
                            );


                            const hudItems =
                                sceneItems.filter(
                                    item =>
                                        item.metadata?.[
                                            TOKEN_HUD_METADATA_KEY
                                        ]?.characterId ===
                                            character.id &&
                                        item.metadata?.[
                                            TOKEN_HUD_METADATA_KEY
                                        ]?.ownerId ===
                                            OBR.player.id &&
                                        item.metadata?.[
                                            TOKEN_HUD_METADATA_KEY
                                        ]?.roomId ===
                                            roomId &&
                                        item.metadata?.[
                                            TOKEN_HUD_METADATA_KEY
                                        ]?.tokenId ===
                                            tokenId
                                );


                            if (
                                !existingLink ||
                                existingLink.tokenId !==
                                    tokenId
                            ) {

                                const repairedRecord = {
                                    ...character,
                                    owlbearTokenLinks: {
                                        ...(character.owlbearTokenLinks || {}),
                                        [roomId]: {
                                            tokenId,
                                            hudItemIds:
                                                hudItems.map(
                                                    item =>
                                                        item.id
                                                ),
                                            labelId:
                                                null,
                                            linkedAt:
                                                Date.now()
                                        }
                                    }
                                };


                                await window.RPGCharacterStore
                                    ?.putCharacter(
                                        repairedRecord
                                    );

                            }

                        }

                    }


                    async function getLocalCharacters() {

                        if (
                            typeof window.RPGCharacterStore
                                ?.getAllCharacters ===
                            "function"
                        ) {

                            return (
                                await window.RPGCharacterStore
                                    .getAllCharacters()
                            ) || [];

                        }


                        return [];

                    }


                    async function findLinkedCharacterReferenceByTokenId(
                        tokenId
                    ) {

                        if (
                            !tokenId ||
                            !(await OBR.scene.isReady())
                        ) {

                            return null;

                        }


                        const tokenItems =
                            await OBR.scene.items.getItems(
                                [
                                    tokenId
                                ]
                            );


                        const token =
                            tokenItems[0];


                        const directMeta =
                            token?.metadata?.[
                                TOKEN_LINK_METADATA_KEY
                            ];


                        if (
                            directMeta?.characterId &&
                            directMeta?.ownerId &&
                            directMeta?.roomId ===
                                roomId
                        ) {

                            return {
                                ownerId:
                                    directMeta.ownerId,
                                characterId:
                                    directMeta.characterId,
                                tokenId,
                                source:
                                    directMeta.ownerId ===
                                        OBR.player.id
                                            ? "local"
                                            : "remote"
                            };

                        }


                        const linkedItems =
                            await OBR.scene.items.getItems(
                                item => {

                                    const hudMeta =
                                        item.metadata?.[
                                            TOKEN_HUD_METADATA_KEY
                                        ];


                                    const conditionMeta =
                                        item.metadata?.[
                                            TOKEN_CONDITION_METADATA_KEY
                                        ];


                                    const meta =
                                        hudMeta ||
                                        conditionMeta;


                                    return (
                                        meta?.tokenId ===
                                            tokenId &&
                                        meta?.roomId ===
                                            roomId
                                    );

                                }
                            );


                        const firstHudMeta =
                            linkedItems
                                .map(
                                    item =>
                                        item.metadata?.[
                                            TOKEN_HUD_METADATA_KEY
                                        ] ||
                                        null
                                )
                                .find(
                                    Boolean
                                );


                        const firstConditionMeta =
                            linkedItems
                                .map(
                                    item =>
                                        item.metadata?.[
                                            TOKEN_CONDITION_METADATA_KEY
                                        ] ||
                                        null
                                )
                                .find(
                                    Boolean
                                );


                        const firstMeta =
                            firstHudMeta ||
                            firstConditionMeta ||
                            null;


                        if (
                            firstMeta?.characterId
                        ) {

                            return {
                                ownerId:
                                    firstMeta.ownerId ||
                                    "",
                                characterId:
                                    firstMeta.characterId,
                                tokenId,
                                source:
                                    firstMeta.ownerId &&
                                    firstMeta.ownerId !==
                                        OBR.player.id
                                            ? "remote"
                                            : "local"
                            };

                        }


                        const localCharacters =
                            await getLocalCharacters();


                        const localMatch =
                            localCharacters.find(
                                character =>
                                    getRoomTokenLink(
                                        character,
                                        roomId
                                    )?.tokenId ===
                                        tokenId
                            );


                        if (
                            localMatch
                        ) {

                            return {
                                ownerId:
                                    OBR.player.id,
                                characterId:
                                    localMatch.id,
                                tokenId,
                                source:
                                    "local"
                            };

                        }


                        return null;

                    }


                    async function loadCharacterForTokenId(
                        tokenId
                    ) {

                        const reference =
                            await findLinkedCharacterReferenceByTokenId(
                                tokenId
                            );


                        if (
                            !reference?.characterId
                        ) {

                            return null;

                        }


                        const localRecord =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    reference.characterId
                                );


                        if (
                            localRecord
                        ) {

                            if (
                                reference.ownerId !==
                                OBR.player.id
                            ) {

                                reference.ownerId =
                                    OBR.player.id;


                                await setTokenLinkMetadata(
                                    tokenId,
                                    reference.characterId,
                                    OBR.player.id
                                );

                            }


                            return {
                                reference,
                                record:
                                    localRecord,
                                remoteEditSession:
                                    null
                            };

                        }


                        if (
                            playerRole ===
                            "GM"
                        ) {

                            const registry =
                                await getRoomSharedRegistry();


                            const shared =
                                registry.find(
                                    item =>
                                        item.characterId ===
                                        reference.characterId &&
                                        item.roomId ===
                                        roomId
                                );


                            if (
                                shared?.ownerId &&
                                shared.ownerId !==
                                    OBR.player.id
                            ) {

                                reference.ownerId =
                                    shared.ownerId;


                                await setTokenLinkMetadata(
                                    tokenId,
                                    reference.characterId,
                                    shared.ownerId
                                );

                            }

                        }


                        if (
                            !reference.ownerId ||
                            reference.ownerId ===
                                OBR.player.id
                        ) {

                            throw new Error(
                                "This token is linked, but its owner could not be resolved to a connected shared character."
                            );

                        }


                        if (
                            playerRole !==
                            "GM"
                        ) {

                            throw new Error(
                                "Only the GM can edit another player's condition list."
                            );

                        }


                        const sharedCharacter =
                            {
                                ownerId:
                                    reference.ownerId,
                                characterId:
                                    reference.characterId
                            };


                        const record =
                            await requestCharacterSheet(
                                sharedCharacter
                            );


                        return {
                            reference,
                            record,
                            remoteEditSession: {
                                ownerId:
                                    reference.ownerId,
                                characterId:
                                    reference.characterId,
                                baseRevision:
                                    Number(
                                        record.revision ||
                                        0
                                    )
                            }
                        };

                    }


                    async function saveTokenLinkedCharacter({
                        record,
                        remoteEditSession
                    }) {

                        if (
                            remoteEditSession
                        ) {

                            const result =
                                await updateRemoteCharacter({
                                    ownerId:
                                        remoteEditSession.ownerId,
                                    characterId:
                                        remoteEditSession.characterId,
                                    baseRevision:
                                        remoteEditSession.baseRevision,
                                    record
                                });


                            const updatedRecord =
                                {
                                    ...record,
                                    revision:
                                        result.revision,
                                    updatedAt:
                                        result.updatedAt
                                };


                            await updateCharacterTokenDisplay(
                                updatedRecord,
                                null,
                                remoteEditSession.ownerId
                            );


                            await updateCharacterConditionOverlays(
                                updatedRecord,
                                null,
                                remoteEditSession.ownerId
                            );


                            return {
                                record:
                                    updatedRecord,
                                remoteEditSession: {
                                    ...remoteEditSession,
                                    baseRevision:
                                        Number(
                                            result.revision ||
                                            remoteEditSession.baseRevision ||
                                            0
                                        )
                                }
                            };

                        }


                        const updatedRecord =
                            {
                                ...record,
                                revision:
                                    Number(
                                        record.revision ||
                                        0
                                    ) + 1,
                                updatedAt:
                                    Date.now()
                            };


                        await window.RPGCharacterStore
                            ?.putCharacter(
                                updatedRecord
                            );


                        try {

                            await syncSharedCharacter(
                                updatedRecord
                            );

                        }

                        catch (
                            error
                        ) {

                            console.error(
                                "Could not refresh Owlbear shared character while saving conditions:",
                                error
                            );

                        }


                        await updateCharacterTokenDisplay(
                            updatedRecord
                        );


                        await updateCharacterConditionOverlays(
                            updatedRecord
                        );


                        await OBR.broadcast.sendMessage(
                            LIVE_SHEET_CHANNEL,
                            {
                                type:
                                    "owner-sheet-updated",
                                characterId:
                                    updatedRecord.id,
                                revision:
                                    updatedRecord.revision,
                                roomId
                            },
                            {
                                destination:
                                    "LOCAL"
                            }
                        );


                        return {
                            record:
                                updatedRecord,
                            remoteEditSession:
                                null
                        };

                    }


                    async function setupConditionsContextMenu() {

                        await OBR.contextMenu.remove(
                            "com.rpgunleashed.character-sheet/conditions-menu"
                        ).catch(
                            () => {}
                        );


                        await OBR.contextMenu.create({
                            id:
                                "com.rpgunleashed.character-sheet/conditions-menu",
                            icons: [
                                {
                                    icon:
                                        "/icons/icon-192.png",
                                    label:
                                        "RPG Controls",
                                    filter: {
                                        min:
                                            1,
                                        max:
                                            1,
                                        every: [
                                            {
                                                key:
                                                    "layer",
                                                value:
                                                    "CHARACTER"
                                            }
                                        ]
                                    }
                                }
                            ],
                            onClick() {},
                            embed: {
                                url:
                                    "/owlbear-conditions.html",
                                height:
                                    520
                            }
                        });

                    }


                    async function getSelectedCharacterTokenId() {

                        const selection =
                            await OBR.player.getSelection();


                        if (
                            !selection ||
                            selection.length !==
                                1
                        ) {

                            return null;

                        }


                        const items =
                            await OBR.scene.items.getItems(
                                selection
                            );


                        const item =
                            items[0];


                        if (
                            !item ||
                            item.layer !==
                                "CHARACTER"
                        ) {

                            return null;

                        }


                        return item.id;

                    }


                    async function findCharacterHudItems(
                        characterId,
                        ownerIdOverride = null
                    ) {

                        if (
                            !(await OBR.scene.isReady())
                        ) {

                            return [];

                        }


                        const expectedOwnerId =
                            ownerIdOverride ||
                            OBR.player.id;


                        return OBR.scene.items.getItems(
                            item => {

                                const meta =
                                    item.metadata?.[
                                        TOKEN_HUD_METADATA_KEY
                                    ];


                                return (
                                    meta?.characterId ===
                                        characterId &&
                                    meta?.ownerId ===
                                        expectedOwnerId &&
                                    meta?.roomId ===
                                        roomId
                                );

                            }
                        );

                    }


                    function clampHudFraction(
                        current,
                        maximum
                    ) {

                        if (
                            maximum <= 0
                        ) {

                            return 0;

                        }


                        return Math.max(
                            0,
                            Math.min(
                                1,
                                current / maximum
                            )
                        );

                    }


                    function getHudBarStatePath(
                        type,
                        fraction
                    ) {

                        const percent =
                            Math.max(
                                0,
                                Math.min(
                                    100,
                                    Math.round(
                                        fraction *
                                        100
                                    )
                                )
                            );


                        const base =
                            type ===
                            "mana"
                                ? TOKEN_HUD_ASSETS.manaStates
                                : TOKEN_HUD_ASSETS.hpStates;


                        return (
                            base +
                            type +
                            "-" +
                            String(
                                percent
                            ).padStart(
                                3,
                                "0"
                            ) +
                            ".png"
                        );

                    }


                    function buildHudImageItem({
                        character,
                        token,
                        ownerIdOverride,
                        assetPath,
                        pixelWidth,
                        pixelHeight,
                        sceneDpi,
                        desiredWidth,
                        centerX,
                        centerY,
                        kind
                    }) {

                        const imageDpi =
                            pixelWidth *
                            sceneDpi /
                            desiredWidth;


                        let builder =
                            buildImage(
                                {
                                    width:
                                        pixelWidth,
                                    height:
                                        pixelHeight,
                                    url:
                                        new URL(
                                            assetPath,
                                            window.location.origin
                                        ).href,
                                    mime:
                                        "image/png"
                                },
                                {
                                    dpi:
                                        imageDpi,
                                    offset: {
                                        x:
                                            pixelWidth / 2,
                                        y:
                                            pixelHeight / 2
                                    }
                                }
                            )
                            .position({
                                x:
                                    centerX,
                                y:
                                    centerY
                            })
                            .layer(
                                "ATTACHMENT"
                            )
                            .attachedTo(
                                token.id
                            )
                            .locked(
                                true
                            )
                            .disableHit(
                                true
                            )
                            .metadata({
                                [TOKEN_HUD_METADATA_KEY]:
                                    {
                                        characterId:
                                            character.id,
                                        ownerId:
                                            ownerIdOverride ||
                                            OBR.player.id,
                                        roomId,
                                        tokenId:
                                            token.id,
                                        kind
                                    }
                            });


                        return builder.build();

                    }


                    function buildHudNumberItem({
                        character,
                        token,
                        ownerIdOverride,
                        value,
                        centerX,
                        centerY,
                        desiredIconWidth,
                        kind
                    }) {

                        return buildText()
                            .plainText(
                                String(
                                    value
                                )
                            )
                            .textType(
                                "PLAIN"
                            )
                            .width(
                                Math.max(
                                    34,
                                    desiredIconWidth *
                                    1.4
                                )
                            )
                            .height(
                                Math.max(
                                    28,
                                    desiredIconWidth
                                )
                            )
                            .padding(
                                0
                            )
                            .fontSize(
                                30
                            )
                            .fontWeight(
                                900
                            )
                            .textAlign(
                                "CENTER"
                            )
                            .textAlignVertical(
                                "MIDDLE"
                            )
                            .fillColor(
                                "#ffffff"
                            )
                            .fillOpacity(
                                1
                            )
                            .strokeColor(
                                "#000000"
                            )
                            .strokeOpacity(
                                1
                            )
                            .strokeWidth(
                                6
                            )
                            .position({
                                x:
                                    centerX,
                                y:
                                    centerY
                            })
                            .layer(
                                "ATTACHMENT"
                            )
                            .attachedTo(
                                token.id
                            )
                            .locked(
                                true
                            )
                            .disableHit(
                                true
                            )
                            .metadata({
                                [TOKEN_HUD_METADATA_KEY]:
                                    {
                                        characterId:
                                            character.id,
                                        ownerId:
                                            ownerIdOverride ||
                                            OBR.player.id,
                                        roomId,
                                        tokenId:
                                            token.id,
                                        kind:
                                            kind +
                                            "-number"
                                    }
                            })
                            .build();

                    }


                    async function createCharacterHudItems(
                        character,
                        token,
                        vitalsOverride = null,
                        ownerIdOverride = null
                    ) {

                        const bounds =
                            await OBR.scene.items.getItemBounds(
                                [token.id]
                            );


                        const vitals =
                            vitalsOverride
                                ? normalizeVitals(
                                    vitalsOverride
                                )
                                : getVitalsFromCharacterRecord(
                                    character
                                );


                        const sceneDpi =
                            await OBR.scene.grid.getDpi();


                        const desiredBarWidth =
                            Math.max(
                                115,
                                bounds.width *
                                1.12
                            );


                        const desiredBarHeight =
                            desiredBarWidth *
                            (
                                TOKEN_HUD_BAR_HEIGHT /
                                TOKEN_HUD_BAR_WIDTH
                            );


                        const desiredIconWidth =
                            Math.max(
                                26,
                                bounds.width *
                                0.28
                            );


                        const desiredIconHeight =
                            desiredIconWidth *
                            (
                                TOKEN_HUD_ICON_HEIGHT /
                                TOKEN_HUD_ICON_WIDTH
                            );


                        const gap =
                            Math.max(
                                3,
                                bounds.height *
                                0.025
                            );


                        let cursorY =
                            bounds.max.y +
                            gap;


                        const items =
                            [];


                        const addBar =
                            (
                                type,
                                fraction
                            ) => {

                                const centerY =
                                    cursorY +
                                    (
                                        desiredBarHeight /
                                        2
                                    );


                                items.push(
                                    buildHudImageItem({
                                        character,
                                        token,
                                        ownerIdOverride,
                                        assetPath:
                                            getHudBarStatePath(
                                                type,
                                                fraction
                                            ),
                                        pixelWidth:
                                            TOKEN_HUD_BAR_WIDTH,
                                        pixelHeight:
                                            TOKEN_HUD_BAR_HEIGHT,
                                        sceneDpi,
                                        desiredWidth:
                                            desiredBarWidth,
                                        centerX:
                                            bounds.center.x,
                                        centerY,
                                        kind:
                                            type +
                                            "-bar"
                                    })
                                );


                                cursorY +=
                                    desiredBarHeight +
                                    gap;

                            };


                        if (
                            vitals.hpMax > 0 ||
                            vitals.hpCurrent > 0
                        ) {

                            addBar(
                                "hp",
                                clampHudFraction(
                                    vitals.hpCurrent,
                                    vitals.hpMax
                                )
                            );

                        }


                        if (
                            vitals.manaMax > 0 ||
                            vitals.manaCurrent > 0
                        ) {

                            addBar(
                                "mana",
                                clampHudFraction(
                                    vitals.manaCurrent,
                                    vitals.manaMax
                                )
                            );

                        }


                        const totalDr =
                            vitals.drArmor +
                            vitals.drNatural +
                            vitals.drMagic;


                        const iconEntries =
                            [];


                        if (
                            totalDr > 0
                        ) {

                            iconEntries.push({
                                assetPath:
                                    TOKEN_HUD_ASSETS.drIcon,
                                value:
                                    totalDr,
                                kind:
                                    "dr"
                            });

                        }


                        if (
                            vitals.nl > 0
                        ) {

                            iconEntries.push({
                                assetPath:
                                    TOKEN_HUD_ASSETS.nlIcon,
                                value:
                                    vitals.nl,
                                kind:
                                    "nl"
                            });

                        }


                        if (
                            iconEntries.length
                        ) {

                            const iconGap =
                                Math.max(
                                    4,
                                    desiredIconWidth *
                                    0.18
                                );


                            const totalIconWidth =
                                (
                                    iconEntries.length *
                                    desiredIconWidth
                                ) +
                                (
                                    Math.max(
                                        0,
                                        iconEntries.length - 1
                                    ) *
                                    iconGap
                                );


                            let iconCenterX =
                                bounds.center.x -
                                (
                                    totalIconWidth /
                                    2
                                ) +
                                (
                                    desiredIconWidth /
                                    2
                                );


                            const iconCenterY =
                                cursorY +
                                (
                                    desiredIconHeight /
                                    2
                                );


                            iconEntries.forEach(
                                entry => {

                                    items.push(
                                        buildHudImageItem({
                                            character,
                                            token,
                                            ownerIdOverride,
                                            assetPath:
                                                entry.assetPath,
                                            pixelWidth:
                                                TOKEN_HUD_ICON_WIDTH,
                                            pixelHeight:
                                                TOKEN_HUD_ICON_HEIGHT,
                                            sceneDpi,
                                            desiredWidth:
                                                desiredIconWidth,
                                            centerX:
                                                iconCenterX,
                                            centerY:
                                                iconCenterY,
                                            kind:
                                                entry.kind +
                                                "-icon"
                                        })
                                    );


                                    items.push(
                                        buildHudNumberItem({
                                            character,
                                            token,
                                            ownerIdOverride,
                                            value:
                                                entry.value,
                                            centerX:
                                                iconCenterX,
                                            centerY:
                                                iconCenterY,
                                            desiredIconWidth,
                                            kind:
                                                entry.kind
                                        })
                                    );


                                    iconCenterX +=
                                        desiredIconWidth +
                                        iconGap;

                                }
                            );

                        }


                        if (
                            items.length
                        ) {

                            await OBR.scene.items.addItems(
                                items
                            );

                        }


                        return items;

                    }


                    async function removeCharacterHudItems(
                        character,
                        link = null,
                        ownerIdOverride = null
                    ) {

                        const found =
                            await findCharacterHudItems(
                                character.id,
                                ownerIdOverride
                            );


                        const ids =
                            new Set(
                                found.map(
                                    item => item.id
                                )
                            );


                        getHudItemIdsFromLink(
                            link
                        )
                        .forEach(
                            id => ids.add(
                                id
                            )
                        );


                        if (
                            ids.size
                        ) {

                            await OBR.scene.items.deleteItems(
                                Array.from(
                                    ids
                                )
                            );

                        }

                    }


                    async function updateCharacterTokenDisplay(
                        character,
                        vitalsOverride = null,
                        ownerIdOverride = null
                    ) {

                        if (
                            !character ||
                            !(await OBR.scene.isReady())
                        ) {

                            return false;

                        }


                        const storedCharacter =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    character.id
                                );


                        const sourceCharacter =
                            storedCharacter ||
                            character;


                        const link =
                            getRoomTokenLink(
                                sourceCharacter,
                                roomId
                            );


                        if (
                            !link?.tokenId
                        ) {

                            return false;

                        }


                        const tokenItems =
                            await OBR.scene.items.getItems(
                                [link.tokenId]
                            );


                        const token =
                            tokenItems[0];


                        if (
                            !token ||
                            token.layer !==
                                "CHARACTER"
                        ) {

                            return false;

                        }


                        const vitals =
                            vitalsOverride
                                ? normalizeVitals(
                                    vitalsOverride
                                )
                                : getVitalsFromCharacterRecord(
                                    character
                                );


                        await removeCharacterHudItems(
                            sourceCharacter,
                            link,
                            ownerIdOverride
                        );


                        const createdItems =
                            await createCharacterHudItems(
                                sourceCharacter,
                                token,
                                vitals,
                                ownerIdOverride
                            );


                        const latest =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    character.id
                                );


                        if (
                            latest
                        ) {

                            await window.RPGCharacterStore
                                .putCharacter({
                                    ...latest,
                                    owlbearTokenLinks: {
                                        ...(latest.owlbearTokenLinks || {}),
                                        [roomId]: {
                                            tokenId:
                                                token.id,
                                            hudItemIds:
                                                createdItems.map(
                                                    item =>
                                                        item.id
                                                ),
                                            labelId:
                                                null,
                                            linkedAt:
                                                Date.now()
                                        }
                                    }
                                });

                        }


                        return true;

                    }


                    async function unlinkCharacterToken(character) {
                        if (!character) {
                            return character;
                        }

                        const latest =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    character.id
                                ) ||
                            character;

                        const link =
                            getRoomTokenLink(
                                latest,
                                roomId
                            );

                        if (await OBR.scene.isReady()) {
                            await removeCharacterHudItems(
                                latest,
                                link
                            );

                            await removeCharacterConditionOverlays(
                                latest
                            );

                            if (
                                link?.tokenId
                            ) {

                                await clearTokenLinkMetadata(
                                    link.tokenId,
                                    latest.id,
                                    OBR.player.id
                                );

                            }
                        }

                        const links = {
                            ...(latest.owlbearTokenLinks || {})
                        };

                        delete links[roomId];

                        const updated = {
                            ...latest,
                            owlbearTokenLinks: links
                        };

                        await window.RPGCharacterStore
                            ?.putCharacter(
                                updated
                            );

                        return updated;
                    }

                    async function linkCharacterToSelectedToken(character) {
                        if (!(await OBR.scene.isReady())) {
                            throw new Error(
                                "Open an Owlbear scene before linking a token."
                            );
                        }

                        const selection =
                            await OBR.player.getSelection();

                        if (
                            !selection ||
                            selection.length !== 1
                        ) {
                            throw new Error(
                                "Select exactly one Character token in Owlbear, then press Link Token."
                            );
                        }

                        const selectedItems =
                            await OBR.scene.items.getItems(
                                selection
                            );

                        const token =
                            selectedItems[0];

                        if (
                            !token ||
                            token.layer !== "CHARACTER"
                        ) {
                            throw new Error(
                                "The selected Owlbear item must be on the Character layer."
                            );
                        }

                        const latest =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    character.id
                                ) ||
                            character;

                        await unlinkCharacterToken(
                            latest
                        );


                        await setTokenLinkMetadata(
                            token.id,
                            latest.id,
                            OBR.player.id
                        );


                        const hudItems =
                            await createCharacterHudItems(
                                latest,
                                token
                            );

                        const updated = {
                            ...latest,
                            owlbearTokenLinks: {
                                ...(latest.owlbearTokenLinks || {}),
                                [roomId]: {
                                    tokenId:
                                        token.id,
                                    hudItemIds:
                                        hudItems.map(
                                            item =>
                                                item.id
                                        ),
                                    labelId:
                                        null,
                                    linkedAt:
                                        Date.now()
                                }
                            }
                        };

                        await window.RPGCharacterStore
                            ?.putCharacter(
                                updated
                            );


                        await updateCharacterConditionOverlays(
                            updated
                        );


                        return updated;
                    }


                    async function findCharacterConditionOverlayItems(
                        characterId,
                        ownerIdOverride = null
                    ) {

                        if (
                            !(await OBR.scene.isReady())
                        ) {

                            return [];

                        }


                        return OBR.scene.items.getItems(
                            item => {

                                const meta =
                                    item.metadata?.[
                                        TOKEN_CONDITION_METADATA_KEY
                                    ];


                                return (
                                    meta?.characterId ===
                                        characterId &&
                                    meta?.ownerId ===
                                        (
                                            ownerIdOverride ||
                                            OBR.player.id
                                        ) &&
                                    meta?.roomId ===
                                        roomId
                                );

                            }
                        );

                    }


                    async function removeCharacterConditionOverlays(
                        character,
                        ownerIdOverride = null
                    ) {

                        const items =
                            await findCharacterConditionOverlayItems(
                                character.id,
                                ownerIdOverride
                            );


                        if (
                            items.length
                        ) {

                            await OBR.scene.items.deleteItems(
                                items.map(
                                    item =>
                                        item.id
                                )
                            );

                        }

                    }


                    async function createConditionOverlayItem(
                        character,
                        token,
                        condition,
                        ownerIdOverride = null
                    ) {

                        const assetPath =
                            CONDITION_OVERLAY_ASSETS[
                                condition.id
                            ];


                        if (
                            !assetPath
                        ) {

                            return null;

                        }


                        const bounds =
                            await OBR.scene.items.getItemBounds(
                                [
                                    token.id
                                ]
                            );


                        const sceneDpi =
                            await OBR.scene.grid.getDpi();


                        const desiredWidth =
                            Math.max(
                                1,
                                bounds.width *
                                1.35
                            );


                        const imageDpi =
                            CONDITION_ASSET_WIDTH *
                            sceneDpi /
                            desiredWidth;


                        return buildImage(
                            {
                                width:
                                    CONDITION_ASSET_WIDTH,
                                height:
                                    CONDITION_ASSET_HEIGHT,
                                url:
                                    new URL(
                                        assetPath,
                                        window.location.origin
                                    ).href,
                                mime:
                                    "image/png"
                            },
                            {
                                dpi:
                                    imageDpi,
                                offset: {
                                    x:
                                        CONDITION_ASSET_WIDTH /
                                        2,
                                    y:
                                        CONDITION_ASSET_HEIGHT /
                                        2
                                }
                            }
                        )
                        .position({
                            x:
                                bounds.center.x,
                            y:
                                bounds.center.y -
                                (bounds.height * 0.06)
                        })
                        .layer(
                            "ATTACHMENT"
                        )
                        .attachedTo(
                            token.id
                        )
                        .locked(
                            true
                        )
                        .disableHit(
                            true
                        )
                        .metadata({
                            [TOKEN_CONDITION_METADATA_KEY]:
                                {
                                    characterId:
                                        character.id,
                                    ownerId:
                                        ownerIdOverride ||
                                        OBR.player.id,
                                    roomId,
                                    tokenId:
                                        token.id,
                                    conditionId:
                                        condition.id,
                                    stacks:
                                        condition.stacks
                                }
                        })
                        .build();

                    }


                    async function updateCharacterConditionOverlays(
                        character,
                        conditionOverride = null,
                        ownerIdOverride = null
                    ) {

                        if (
                            !character ||
                            !(await OBR.scene.isReady())
                        ) {

                            return false;

                        }


                        const storedCharacter =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    character.id
                                );


                        const sourceCharacter =
                            storedCharacter ||
                            character;


                        const link =
                            getRoomTokenLink(
                                sourceCharacter,
                                roomId
                            );


                        if (
                            !link?.tokenId
                        ) {

                            return false;

                        }


                        const tokenItems =
                            await OBR.scene.items.getItems(
                                [
                                    link.tokenId
                                ]
                            );


                        const token =
                            tokenItems[0];


                        if (
                            !token ||
                            token.layer !==
                                "CHARACTER"
                        ) {

                            return false;

                        }


                        const conditions =
                            Array.isArray(
                                conditionOverride
                            )
                                ? conditionOverride
                                : getConditionsFromCharacterRecord(
                                    character
                                );


                        await removeCharacterConditionOverlays(
                            sourceCharacter,
                            ownerIdOverride
                        );


                        const overlays =
                            [];


                        for (
                            const condition
                            of conditions
                        ) {

                            const item =
                                await createConditionOverlayItem(
                                    sourceCharacter,
                                    token,
                                    condition,
                                    ownerIdOverride
                                );


                            if (
                                item
                            ) {

                                overlays.push(
                                    item
                                );

                            }

                        }


                        if (
                            overlays.length
                        ) {

                            await OBR.scene.items.addItems(
                                overlays
                            );

                        }


                        return true;

                    }


                    async function getRemovedPartyCharacters() {

                        const metadata =
                            await OBR.room.getMetadata();


                        return cleanRemovedPartyCharacters(
                            metadata[
                                REMOVED_PARTY_CHARACTERS_KEY
                            ]
                        );

                    }


                    async function setRemovedPartyCharacters(
                        removed
                    ) {

                        await OBR.room.setMetadata({
                            [REMOVED_PARTY_CHARACTERS_KEY]:
                                Array.from(
                                    new Set(
                                        removed
                                    )
                                )
                        });

                    }


                    async function clearPartyCharacterRemoval(
                        ownerId,
                        characterId
                    ) {

                        const key =
                            partyCharacterKey(
                                ownerId,
                                characterId
                            );


                        const removed =
                            await getRemovedPartyCharacters();


                        const next =
                            removed.filter(
                                item =>
                                    item !==
                                    key
                            );


                        if (
                            next.length !==
                            removed.length
                        ) {

                            await setRemovedPartyCharacters(
                                next
                            );

                        }

                    }


                    function isCharacterSharedLocally(
                        character
                    ) {

                        return Boolean(
                            character?.owlbearSharedRooms?.[
                                roomId
                            ]
                        );

                    }


                    async function getRoomSharedRegistry() {

                        const metadata =
                            await OBR.room.getMetadata();


                        return cleanSharedCharacters(
                            metadata[
                                ROOM_SHARED_CHARACTERS_KEY
                            ]
                        );

                    }


                    async function setRoomSharedRegistry(
                        characters
                    ) {

                        await OBR.room.setMetadata({
                            [ROOM_SHARED_CHARACTERS_KEY]:
                                cleanSharedCharacters(
                                    characters
                                )
                        });

                    }


                    async function upsertRoomSharedCharacter(
                        character
                    ) {

                        const registry =
                            await getRoomSharedRegistry();


                        const index =
                            registry.findIndex(
                                item =>
                                    item.characterId ===
                                        character.id
                            );


                        const entry = {
                            characterId:
                                character.id,
                            name:
                                character.name ||
                                "Unnamed Character",
                            race:
                                character.race ||
                                "",
                            level:
                                character.level ||
                                "",
                            campaign:
                                character.campaign ||
                                "",
                            ownerId:
                                OBR.player.id,
                            ownerName:
                                playerName ||
                                "Player",
                            roomId,
                            updatedAt:
                                Date.now()
                        };


                        if (
                            index >= 0
                        ) {

                            registry[
                                index
                            ] = {
                                ...registry[
                                    index
                                ],
                                ...entry
                            };

                        }

                        else {

                            registry.push(
                                entry
                            );

                        }


                        await setRoomSharedRegistry(
                            registry
                        );


                        return entry;

                    }


                    async function removeRoomSharedCharacter(
                        characterId
                    ) {

                        const registry =
                            await getRoomSharedRegistry();


                        const next =
                            registry.filter(
                                item =>
                                    item.characterId !==
                                        characterId
                            );


                        if (
                            next.length !==
                            registry.length
                        ) {

                            await setRoomSharedRegistry(
                                next
                            );

                        }

                    }


                    async function migrateAndRestoreSharedCharacters() {

                        const localCharacters =
                            await getLocalCharacters();


                        const playerMetadata =
                            await OBR.player.getMetadata();


                        const legacyShared =
                            cleanSharedCharacters(
                                playerMetadata[
                                    SHARED_CHARACTERS_KEY
                                ]
                            )
                            .filter(
                                item =>
                                    item.roomId ===
                                    roomId
                            );


                        const legacyIds =
                            new Set(
                                legacyShared.map(
                                    item =>
                                        item.characterId
                                )
                            );


                        for (
                            const character
                            of localCharacters
                        ) {

                            let shared =
                                isCharacterSharedLocally(
                                    character
                                );


                            if (
                                !shared &&
                                legacyIds.has(
                                    character.id
                                )
                            ) {

                                const migrated = {
                                    ...character,
                                    owlbearSharedRooms: {
                                        ...(character.owlbearSharedRooms || {}),
                                        [roomId]:
                                            true
                                    }
                                };


                                await window.RPGCharacterStore
                                    ?.putCharacter(
                                        migrated
                                    );


                                character.owlbearSharedRooms =
                                    migrated.owlbearSharedRooms;


                                shared =
                                    true;

                            }


                            if (
                                shared
                            ) {

                                await upsertRoomSharedCharacter(
                                    character
                                );

                            }

                        }

                    }


                    async function syncSharedCharacter(
                        character
                    ) {

                        await updateCharacterTokenDisplay(
                            character
                        );


                        await updateCharacterConditionOverlays(
                            character
                        );


                        const metadata =
                            await OBR.player.getMetadata();


                        const allShared =
                            cleanSharedCharacters(
                                metadata[
                                    SHARED_CHARACTERS_KEY
                                ]
                            );


                        const currentIndex =
                            allShared.findIndex(
                                shared =>
                                    shared.characterId ===
                                    character.id &&
                                    shared.roomId ===
                                    roomId
                            );


                        const locallyShared =
                            isCharacterSharedLocally(
                                character
                            );


                        if (
                            currentIndex <
                            0 &&
                            !locallyShared
                        ) {

                            return false;

                        }


                        if (
                            locallyShared
                        ) {

                            await upsertRoomSharedCharacter(
                                character
                            );

                        }


                        const campaign =
                            String(
                                character.campaign ||
                                ""
                            ).trim();


                        if (
                            !campaign
                        ) {

                            allShared.splice(
                                currentIndex,
                                1
                            );

                        }

                        else if (
                            currentIndex >=
                            0
                        ) {

                            allShared[
                                currentIndex
                            ] = {
                                ...allShared[
                                    currentIndex
                                ],
                                name:
                                    character.name ||
                                    "Unnamed Character",
                                race:
                                    character.race ||
                                    "",
                                level:
                                    character.level ||
                                    "",
                                campaign,
                                ownerName:
                                    playerName ||
                                    "Player",
                                updatedAt:
                                    Date.now()
                            };

                        }


                        else if (
                            locallyShared
                        ) {

                            allShared.push({
                                characterId:
                                    character.id,
                                name:
                                    character.name ||
                                    "Unnamed Character",
                                race:
                                    character.race ||
                                    "",
                                level:
                                    character.level ||
                                    "",
                                campaign,
                                ownerName:
                                    playerName ||
                                    "Player",
                                roomId,
                                updatedAt:
                                    Date.now()
                            });

                        }


                        await OBR.player.setMetadata({
                            [SHARED_CHARACTERS_KEY]:
                                allShared
                        });


                        window.dispatchEvent(
                            new CustomEvent(
                                "rpg-owlbear-party-change"
                            )
                        );


                        return true;

                    }


                    function canRemovePartyCharacter(
                        character
                    ) {

                        return (
                            playerRole ===
                                "GM" ||
                            character?.ownerId ===
                                OBR.player.id
                        );

                    }


                    function canEditPartyCharacter(
                        character
                    ) {

                        return (
                            playerRole ===
                                "GM" &&
                            character?.ownerId &&
                            character.ownerId !==
                                OBR.player.id &&
                            character.ownerOnline !==
                                false
                        );

                    }


                    async function removePartyCharacter(
                        character
                    ) {

                        if (
                            !canRemovePartyCharacter(
                                character
                            )
                        ) {

                            throw new Error(
                                "Only the GM or the character owner can remove this character from the campaign."
                            );

                        }


                        const removed =
                            await getRemovedPartyCharacters();


                        removed.push(
                            partyCharacterKey(
                                character.ownerId,
                                character.characterId
                            )
                        );


                        await setRemovedPartyCharacters(
                            removed
                        );


                        window.dispatchEvent(
                            new CustomEvent(
                                "rpg-owlbear-party-change"
                            )
                        );

                    }


                    async function getMySharedCharacters() {

                        const characters =
                            await getLocalCharacters();


                        return characters
                            .filter(
                                character =>
                                    isCharacterSharedLocally(
                                        character
                                    )
                            )
                            .map(
                                character => ({
                                    characterId:
                                        character.id,
                                    name:
                                        character.name ||
                                        "Unnamed Character",
                                    race:
                                        character.race ||
                                        "",
                                    level:
                                        character.level ||
                                        "",
                                    campaign:
                                        character.campaign ||
                                        "",
                                    ownerName:
                                        playerName ||
                                        "Player",
                                    ownerId:
                                        OBR.player.id,
                                    roomId,
                                    updatedAt:
                                        character.updatedAt ||
                                        Date.now()
                                })
                            );

                    }


                    async function toggleCharacterShare(
                        character
                    ) {

                        const latest =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    character.id
                                ) ||
                            character;


                        const currentlyShared =
                            isCharacterSharedLocally(
                                latest
                            );


                        const nextShared =
                            !currentlyShared;


                        const updated = {
                            ...latest,
                            owlbearSharedRooms: {
                                ...(latest.owlbearSharedRooms || {}),
                                [roomId]:
                                    nextShared
                            }
                        };


                        if (
                            !nextShared
                        ) {

                            delete updated
                                .owlbearSharedRooms[
                                    roomId
                                ];

                        }


                        await window.RPGCharacterStore
                            ?.putCharacter(
                                updated
                            );


                        const metadata =
                            await OBR.player.getMetadata();


                        const allShared =
                            cleanSharedCharacters(
                                metadata[
                                    SHARED_CHARACTERS_KEY
                                ]
                            );


                        const currentIndex =
                            allShared.findIndex(
                                shared =>
                                    shared.characterId ===
                                    character.id &&
                                    shared.roomId ===
                                    roomId
                            );


                        if (
                            nextShared
                        ) {

                            const entry = {
                                characterId:
                                    updated.id,
                                name:
                                    updated.name ||
                                    "Unnamed Character",
                                race:
                                    updated.race ||
                                    "",
                                level:
                                    updated.level ||
                                    "",
                                campaign:
                                    updated.campaign ||
                                    "",
                                ownerName:
                                    playerName ||
                                    "Player",
                                roomId,
                                updatedAt:
                                    Date.now()
                            };


                            if (
                                currentIndex >=
                                0
                            ) {

                                allShared[
                                    currentIndex
                                ] = entry;

                            }

                            else {

                                allShared.push(
                                    entry
                                );

                            }


                            await upsertRoomSharedCharacter(
                                updated
                            );


                            await clearPartyCharacterRemoval(
                                OBR.player.id,
                                updated.id
                            );

                        }

                        else {

                            if (
                                currentIndex >=
                                0
                            ) {

                                allShared.splice(
                                    currentIndex,
                                    1
                                );

                            }


                            await removeRoomSharedCharacter(
                                updated.id
                            );

                        }


                        await OBR.player.setMetadata({
                            [SHARED_CHARACTERS_KEY]:
                                allShared
                        });


                        window.dispatchEvent(
                            new CustomEvent(
                                "rpg-owlbear-party-change"
                            )
                        );


                        return nextShared;

                    }


                    async function getPartySharedCharacters() {

                        const [
                            roomMetadata,
                            partyPlayers
                        ] =
                            await Promise.all([
                                OBR.room.getMetadata(),
                                OBR.party.getPlayers()
                            ]);


                        const removed =
                            new Set(
                                cleanRemovedPartyCharacters(
                                    roomMetadata[
                                        REMOVED_PARTY_CHARACTERS_KEY
                                    ]
                                )
                            );


                        const registry =
                            cleanSharedCharacters(
                                roomMetadata[
                                    ROOM_SHARED_CHARACTERS_KEY
                                ]
                            )
                            .filter(
                                character =>
                                    character.roomId ===
                                    roomId
                            );


                        const onlinePlayers =
                            new Map(
                                [
                                    {
                                        id:
                                            OBR.player.id,
                                        role:
                                            playerRole,
                                        name:
                                            playerName ||
                                            "Player"
                                    },
                                    ...partyPlayers.map(
                                        player => ({
                                            id:
                                                player.id,
                                            role:
                                                player.role,
                                            name:
                                                player.name ||
                                                "Player"
                                        })
                                    )
                                ]
                                .map(
                                    player => [
                                        player.id,
                                        player
                                    ]
                                )
                            );


                        return registry
                            .filter(
                                character =>
                                    !removed.has(
                                        partyCharacterKey(
                                            character.ownerId,
                                            character.characterId
                                        )
                                    )
                            )
                            .map(
                                character => {

                                    const owner =
                                        onlinePlayers.get(
                                            character.ownerId
                                        );


                                    return {
                                        ...character,
                                        ownerName:
                                            character.ownerName ||
                                            owner?.name ||
                                            "Player",
                                        ownerRole:
                                            owner?.role ||
                                            "PLAYER",
                                        ownerOnline:
                                            Boolean(
                                                owner
                                            )
                                    };

                                }
                            );

                    }


                    async function verifyGmSender(
                        connectionId,
                        requesterId
                    ) {

                        const players =
                            await OBR.party.getPlayers();


                        const sender =
                            players.find(
                                player =>
                                    player.connectionId ===
                                    connectionId
                            );


                        return Boolean(
                            sender &&
                            sender.id ===
                                requesterId &&
                            sender.role ===
                                "GM"
                        );

                    }


                    async function sendChunkedTransfer(
                        typePrefix,
                        payload,
                        details
                    ) {

                        const chunks =
                            serializeToChunks(
                                payload
                            );


                        const transferId =
                            makeTransferId();


                        await OBR.broadcast.sendMessage(
                            LIVE_SHEET_CHANNEL,
                            {
                                type:
                                    typePrefix +
                                    "-start",
                                transferId,
                                totalChunks:
                                    chunks.length,
                                roomId,
                                ...details
                            }
                        );


                        for (
                            let index = 0;
                            index < chunks.length;
                            index += 1
                        ) {

                            await OBR.broadcast.sendMessage(
                                LIVE_SHEET_CHANNEL,
                                {
                                    type:
                                        typePrefix +
                                        "-chunk",
                                    transferId,
                                    index,
                                    chunk:
                                        chunks[index],
                                    roomId,
                                    ...details
                                }
                            );

                        }


                        await OBR.broadcast.sendMessage(
                            LIVE_SHEET_CHANNEL,
                            {
                                type:
                                    typePrefix +
                                    "-end",
                                transferId,
                                roomId,
                                ...details
                            }
                        );


                        return transferId;

                    }


                    async function refreshSharedSummaryFromBackground(
                        character
                    ) {

                        const metadata =
                            await OBR.player.getMetadata();


                        const allShared =
                            cleanSharedCharacters(
                                metadata[
                                    SHARED_CHARACTERS_KEY
                                ]
                            );


                        const index =
                            allShared.findIndex(
                                shared =>
                                    shared.characterId ===
                                        character.id &&
                                    shared.roomId ===
                                        roomId
                            );


                        if (
                            index <
                            0
                        ) {

                            return;

                        }


                        allShared[index] = {
                            ...allShared[index],
                            name:
                                character.name ||
                                "Unnamed Character",
                            race:
                                character.race ||
                                "",
                            level:
                                character.level ||
                                "",
                            campaign:
                                character.campaign ||
                                allShared[index].campaign ||
                                "",
                            ownerName:
                                playerName ||
                                allShared[index].ownerName ||
                                "Player",
                            updatedAt:
                                Date.now()
                        };


                        await OBR.player.setMetadata({
                            [SHARED_CHARACTERS_KEY]:
                                allShared
                        });


                        if (
                            isCharacterSharedLocally(
                                character
                            )
                        ) {

                            await upsertRoomSharedCharacter(
                                character
                            );

                        }

                    }


                    if (
                        isBackgroundContext
                    ) {

                        const incomingUpdates =
                            new Map();


                        OBR.broadcast.onMessage(
                            LIVE_SHEET_CHANNEL,
                            async event => {

                                const message =
                                    event.data;


                                if (
                                    !message ||
                                    message.roomId !==
                                        roomId
                                ) {

                                    return;

                                }


                                try {

                                    if (
                                        message.type ===
                                            "sheet-request" &&
                                        message.ownerId ===
                                            OBR.player.id
                                    ) {

                                        if (
                                            !(await verifyGmSender(
                                                event.connectionId,
                                                message.requesterId
                                            ))
                                        ) {

                                            return;

                                        }


                                        const record =
                                            await window.RPGCharacterStore
                                                ?.getCharacterById(
                                                    message.characterId
                                                );


                                        if (
                                            !record
                                        ) {

                                            await OBR.broadcast.sendMessage(
                                                LIVE_SHEET_CHANNEL,
                                                {
                                                    type:
                                                        "sheet-error",
                                                    requestId:
                                                        message.requestId,
                                                    recipientId:
                                                        message.requesterId,
                                                    roomId,
                                                    message:
                                                        "The player no longer has this character saved on this device."
                                                }
                                            );


                                            return;

                                        }


                                        await sendChunkedTransfer(
                                            "sheet",
                                            makeTransferRecord(
                                                record
                                            ),
                                            {
                                                requestId:
                                                    message.requestId,
                                                recipientId:
                                                    message.requesterId,
                                                ownerId:
                                                    OBR.player.id,
                                                characterId:
                                                    message.characterId
                                            }
                                        );


                                        return;

                                    }


                                    if (
                                        message.type ===
                                            "update-start" &&
                                        message.ownerId ===
                                            OBR.player.id
                                    ) {

                                        if (
                                            !(await verifyGmSender(
                                                event.connectionId,
                                                message.requesterId
                                            ))
                                        ) {

                                            return;

                                        }


                                        incomingUpdates.set(
                                            message.transferId,
                                            {
                                                senderConnectionId:
                                                    event.connectionId,
                                                requesterId:
                                                    message.requesterId,
                                                requestId:
                                                    message.requestId,
                                                characterId:
                                                    message.characterId,
                                                baseRevision:
                                                    Number(
                                                        message.baseRevision ||
                                                        0
                                                    ),
                                                totalChunks:
                                                    message.totalChunks,
                                                chunks:
                                                    new Array(
                                                        message.totalChunks
                                                    )
                                            }
                                        );


                                        return;

                                    }


                                    if (
                                        message.type ===
                                            "update-chunk"
                                    ) {

                                        const transfer =
                                            incomingUpdates.get(
                                                message.transferId
                                            );


                                        if (
                                            !transfer ||
                                            transfer.senderConnectionId !==
                                                event.connectionId
                                        ) {

                                            return;

                                        }


                                        transfer.chunks[
                                            message.index
                                        ] =
                                            message.chunk;


                                        return;

                                    }


                                    if (
                                        message.type ===
                                            "update-end"
                                    ) {

                                        const transfer =
                                            incomingUpdates.get(
                                                message.transferId
                                            );


                                        if (
                                            !transfer ||
                                            transfer.senderConnectionId !==
                                                event.connectionId
                                        ) {

                                            return;

                                        }


                                        incomingUpdates.delete(
                                            message.transferId
                                        );


                                        if (
                                            transfer.chunks.some(
                                                chunk =>
                                                    typeof chunk !==
                                                    "string"
                                            )
                                        ) {

                                            throw new Error(
                                                "Remote character update was incomplete."
                                            );

                                        }


                                        const incomingRecord =
                                            deserializeChunks(
                                                transfer.chunks
                                            );


                                        const currentRecord =
                                            await window.RPGCharacterStore
                                                ?.getCharacterById(
                                                    transfer.characterId
                                                );


                                        if (
                                            !currentRecord
                                        ) {

                                            await OBR.broadcast.sendMessage(
                                                LIVE_SHEET_CHANNEL,
                                                {
                                                    type:
                                                        "update-result",
                                                    requestId:
                                                        transfer.requestId,
                                                    recipientId:
                                                        transfer.requesterId,
                                                    roomId,
                                                    status:
                                                        "missing",
                                                    message:
                                                        "The player no longer has this character saved on this device."
                                                }
                                            );


                                            return;

                                        }


                                        const currentRevision =
                                            Number(
                                                currentRecord.revision ||
                                                0
                                            );


                                        if (
                                            currentRevision !==
                                            transfer.baseRevision
                                        ) {

                                            await OBR.broadcast.sendMessage(
                                                LIVE_SHEET_CHANNEL,
                                                {
                                                    type:
                                                        "update-result",
                                                    requestId:
                                                        transfer.requestId,
                                                    recipientId:
                                                        transfer.requesterId,
                                                    roomId,
                                                    status:
                                                        "conflict",
                                                    revision:
                                                        currentRevision,
                                                    message:
                                                        "The character changed after the GM opened it."
                                                }
                                            );


                                            return;

                                        }


                                        const now =
                                            Date.now();


                                        const nextRecord =
                                            preserveOwnerPicture(
                                                {
                                                    ...incomingRecord,
                                                    id:
                                                        currentRecord.id,
                                                    createdAt:
                                                        currentRecord.createdAt,
                                                    revision:
                                                        currentRevision +
                                                        1,
                                                    updatedAt:
                                                        now
                                                },
                                                currentRecord
                                            );


                                        await window.RPGCharacterStore
                                            .putCharacter(
                                                nextRecord
                                            );


                                        await updateCharacterTokenDisplay(
                                            nextRecord
                                        );


                                        await updateCharacterConditionOverlays(
                                            nextRecord
                                        );


                                        await refreshSharedSummaryFromBackground(
                                            nextRecord
                                        );


                                        await OBR.broadcast.sendMessage(
                                            LIVE_SHEET_CHANNEL,
                                            {
                                                type:
                                                    "update-result",
                                                requestId:
                                                    transfer.requestId,
                                                recipientId:
                                                    transfer.requesterId,
                                                roomId,
                                                status:
                                                    "saved",
                                                revision:
                                                    nextRecord.revision,
                                                updatedAt:
                                                    nextRecord.updatedAt
                                            }
                                        );


                                        await OBR.broadcast.sendMessage(
                                            LIVE_SHEET_CHANNEL,
                                            {
                                                type:
                                                    "owner-sheet-updated",
                                                characterId:
                                                    nextRecord.id,
                                                revision:
                                                    nextRecord.revision,
                                                roomId
                                            },
                                            {
                                                destination:
                                                    "LOCAL"
                                            }
                                        );


                                        return;

                                    }

                                }

                                catch (
                                    error
                                ) {

                                    console.error(
                                        "RPG Unleashed background sheet sync failed:",
                                        error
                                    );

                                }

                            }
                        );


                        return;

                    }


                    const pendingSheetRequests =
                        new Map();


                    const pendingUpdates =
                        new Map();


                    const incomingSheets =
                        new Map();


                    OBR.broadcast.onMessage(
                        LIVE_SHEET_CHANNEL,
                        event => {

                            const message =
                                event.data;


                            if (
                                !message ||
                                message.roomId !==
                                    roomId
                            ) {

                                return;

                            }


                            if (
                                message.type ===
                                    "sheet-error" &&
                                message.recipientId ===
                                    OBR.player.id
                            ) {

                                const pending =
                                    pendingSheetRequests.get(
                                        message.requestId
                                    );


                                if (
                                    pending
                                ) {

                                    clearTimeout(
                                        pending.timer
                                    );


                                    pendingSheetRequests.delete(
                                        message.requestId
                                    );


                                    pending.reject(
                                        new Error(
                                            message.message ||
                                            "Could not retrieve the character sheet."
                                        )
                                    );

                                }


                                return;

                            }


                            if (
                                message.type ===
                                    "sheet-start" &&
                                message.recipientId ===
                                    OBR.player.id
                            ) {

                                incomingSheets.set(
                                    message.transferId,
                                    {
                                        requestId:
                                            message.requestId,
                                        ownerId:
                                            message.ownerId,
                                        characterId:
                                            message.characterId,
                                        chunks:
                                            new Array(
                                                message.totalChunks
                                            )
                                    }
                                );


                                return;

                            }


                            if (
                                message.type ===
                                    "sheet-chunk" &&
                                message.recipientId ===
                                    OBR.player.id
                            ) {

                                const transfer =
                                    incomingSheets.get(
                                        message.transferId
                                    );


                                if (
                                    transfer
                                ) {

                                    transfer.chunks[
                                        message.index
                                    ] =
                                        message.chunk;

                                }


                                return;

                            }


                            if (
                                message.type ===
                                    "sheet-end" &&
                                message.recipientId ===
                                    OBR.player.id
                            ) {

                                const transfer =
                                    incomingSheets.get(
                                        message.transferId
                                    );


                                if (
                                    !transfer
                                ) {

                                    return;

                                }


                                incomingSheets.delete(
                                    message.transferId
                                );


                                const pending =
                                    pendingSheetRequests.get(
                                        transfer.requestId
                                    );


                                if (
                                    !pending
                                ) {

                                    return;

                                }


                                clearTimeout(
                                    pending.timer
                                );


                                pendingSheetRequests.delete(
                                    transfer.requestId
                                );


                                try {

                                    if (
                                        transfer.chunks.some(
                                            chunk =>
                                                typeof chunk !==
                                                "string"
                                        )
                                    ) {

                                        throw new Error(
                                            "The character sheet transfer was incomplete."
                                        );

                                    }


                                    pending.resolve(
                                        deserializeChunks(
                                            transfer.chunks
                                        )
                                    );

                                }

                                catch (
                                    error
                                ) {

                                    pending.reject(
                                        error
                                    );

                                }


                                return;

                            }


                            if (
                                message.type ===
                                    "update-result" &&
                                message.recipientId ===
                                    OBR.player.id
                            ) {

                                const pending =
                                    pendingUpdates.get(
                                        message.requestId
                                    );


                                if (
                                    !pending
                                ) {

                                    return;

                                }


                                clearTimeout(
                                    pending.timer
                                );


                                pendingUpdates.delete(
                                    message.requestId
                                );


                                if (
                                    message.status ===
                                    "saved"
                                ) {

                                    pending.resolve({
                                        revision:
                                            message.revision,
                                        updatedAt:
                                            message.updatedAt
                                    });

                                }

                                else {

                                    const error =
                                        new Error(
                                            message.message ||
                                            "The player could not save the remote character update."
                                        );


                                    if (
                                        message.status ===
                                        "conflict"
                                    ) {

                                        error.code =
                                            "REVISION_CONFLICT";

                                    }


                                    pending.reject(
                                        error
                                    );

                                }


                                return;

                            }


                            if (
                                message.type ===
                                "owner-sheet-updated"
                            ) {

                                window.dispatchEvent(
                                    new CustomEvent(
                                        "rpg-remote-character-updated",
                                        {
                                            detail: {
                                                characterId:
                                                    message.characterId,
                                                revision:
                                                    message.revision
                                            }
                                        }
                                    )
                                );

                            }

                        }
                    );


                    async function requestCharacterSheet(
                        character
                    ) {

                        if (
                            !canEditPartyCharacter(
                                character
                            )
                        ) {

                            throw new Error(
                                "Only the GM can remotely edit another player's character."
                            );

                        }


                        const requestId =
                            makeTransferId();


                        const promise =
                            new Promise(
                                (
                                    resolve,
                                    reject
                                ) => {

                                    const timer =
                                        window.setTimeout(
                                            () => {

                                                pendingSheetRequests.delete(
                                                    requestId
                                                );


                                                reject(
                                                    new Error(
                                                        "The player did not respond. Make sure they are still connected to this Owlbear room."
                                                    )
                                                );

                                            },
                                            TRANSFER_TIMEOUT_MS
                                        );


                                    pendingSheetRequests.set(
                                        requestId,
                                        {
                                            resolve,
                                            reject,
                                            timer
                                        }
                                    );

                                }
                            );


                        await OBR.broadcast.sendMessage(
                            LIVE_SHEET_CHANNEL,
                            {
                                type:
                                    "sheet-request",
                                requestId,
                                requesterId:
                                    OBR.player.id,
                                requesterName:
                                    playerName ||
                                    "GM",
                                ownerId:
                                    character.ownerId,
                                characterId:
                                    character.characterId,
                                roomId
                            }
                        );


                        return promise;

                    }


                    async function updateRemoteCharacter({
                        ownerId,
                        characterId,
                        baseRevision,
                        record
                    }) {

                        if (
                            playerRole !==
                            "GM"
                        ) {

                            throw new Error(
                                "Only the GM can save changes to another player's character."
                            );

                        }


                        const requestId =
                            makeTransferId();


                        const promise =
                            new Promise(
                                (
                                    resolve,
                                    reject
                                ) => {

                                    const timer =
                                        window.setTimeout(
                                            () => {

                                                pendingUpdates.delete(
                                                    requestId
                                                );


                                                reject(
                                                    new Error(
                                                        "The player did not confirm the update. Make sure they are still connected to this Owlbear room."
                                                    )
                                                );

                                            },
                                            TRANSFER_TIMEOUT_MS
                                        );


                                    pendingUpdates.set(
                                        requestId,
                                        {
                                            resolve,
                                            reject,
                                            timer
                                        }
                                    );

                                }
                            );


                        await sendChunkedTransfer(
                            "update",
                            makeTransferRecord(
                                record
                            ),
                            {
                                requestId,
                                requesterId:
                                    OBR.player.id,
                                ownerId,
                                characterId,
                                baseRevision:
                                    Number(
                                        baseRevision ||
                                        0
                                    )
                            }
                        );


                        return promise;

                    }


                    if (
                        isBackgroundContext
                    ) {

                        try {

                            await migrateAndRestoreSharedCharacters();


                            await repairLocalTokenLinks();

                        }

                        catch (
                            error
                        ) {

                            console.error(
                                "Could not restore RPG Unleashed sharing/token links:",
                                error
                            );

                        }

                    }


                    if (
                        !isBackgroundContext
                    ) {

                        try {

                            await migrateAndRestoreSharedCharacters();

                        }

                        catch (
                            error
                        ) {

                            console.error(
                                "Could not restore RPG Unleashed shared characters:",
                                error
                            );

                        }

                    }


                    window.RPGOwlbear = {
                        ready:
                            true,
                        roomId,
                        playerId:
                            OBR.player.id,
                        playerName,
                        playerRole,
                        playerConnectionId,
                        getMySharedCharacters,
                        toggleCharacterShare,
                        syncSharedCharacter,
                        getPartySharedCharacters,
                        canRemovePartyCharacter,
                        removePartyCharacter,
                        canEditPartyCharacter,
                        requestCharacterSheet,
                        updateRemoteCharacter,
                        hasCharacterTokenLink,
                        linkCharacterToSelectedToken,
                        unlinkCharacterToken,
                        updateCharacterTokenDisplay,
                        updateCharacterConditionOverlays,
                        loadCharacterForTokenId,
                        saveTokenLinkedCharacter,
                        getSelectedCharacterTokenId,
                        repairLocalTokenLinks,
                        migrateAndRestoreSharedCharacters,
                        conditionDefinitions:
                            CONDITION_DEFINITIONS
                    };


                    document.body.classList.add(
                        "owlbear-connected"
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "rpg-owlbear-ready"
                        )
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "rpg-owlbear-connection-state",
                            {
                                detail: {
                                    state:
                                        "ready"
                                }
                            }
                        )
                    );


                    OBR.party.onChange(
                        () => {

                            window.dispatchEvent(
                                new CustomEvent(
                                    "rpg-owlbear-party-change"
                                )
                            );

                        }
                    );


                    OBR.player.onChange(
                        () => {

                            window.dispatchEvent(
                                new CustomEvent(
                                    "rpg-owlbear-party-change"
                                )
                            );

                        }
                    );


                    OBR.room.onMetadataChange(
                        () => {

                            window.dispatchEvent(
                                new CustomEvent(
                                    "rpg-owlbear-party-change"
                                )
                            );

                        }
                    );

                }

                catch (
                    error
                ) {

                    console.error(
                        "RPG Unleashed Owlbear integration could not initialize:",
                        error
                    );

                }

            }
        );

    }

    catch (
        error
    ) {

        console.error(
            "Could not load the Owlbear Rodeo SDK:",
            error
        );

    }


    })();


    try {

        await owlbearInitializationPromise;

    }

    finally {

        owlbearInitializationPromise =
            null;

    }

}


initializeOwlbear();


window.addEventListener(
    "pageshow",
    () => {

        if (
            !window.RPGOwlbear?.ready
        ) {

            initializeOwlbear();

        }

    }
);


document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
                "visible" &&
            !window.RPGOwlbear?.ready
        ) {

            initializeOwlbear();

        }

    }
);
