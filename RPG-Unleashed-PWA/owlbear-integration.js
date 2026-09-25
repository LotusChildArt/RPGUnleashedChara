const SHARED_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/sharedCharacters";


const REMOVED_PARTY_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/removedPartyCharacters";


const LIVE_SHEET_CHANNEL =
    "com.rpgunleashed.character-sheet/liveSheetV1";


const TOKEN_HUD_METADATA_KEY =
    "com.rpgunleashed.character-sheet/tokenHud";


const TOKEN_CONDITION_METADATA_KEY =
    "com.rpgunleashed.character-sheet/tokenCondition";


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

                    function hasCharacterTokenLink(character) {
                        return Boolean(
                            getRoomTokenLink(
                                character,
                                roomId
                            )
                        );
                    }

                    async function findCharacterHudItems(characterId) {
                        if (!(await OBR.scene.isReady())) return [];

                        return OBR.scene.items.getItems(item => {
                            const meta =
                                item.metadata?.[TOKEN_HUD_METADATA_KEY];

                            return (
                                meta?.characterId === characterId &&
                                meta?.ownerId === OBR.player.id &&
                                meta?.roomId === roomId
                            );
                        });
                    }

                    async function createCharacterHudLabel(character, token, vitalsOverride = null) {
                        const bounds =
                            await OBR.scene.items.getItemBounds(
                                [token.id]
                            );

                        const vitals =
                            vitalsOverride
                                ? normalizeVitals(vitalsOverride)
                                : getVitalsFromCharacterRecord(character);

                        const text =
                            makeTokenHudText(
                                vitals
                            );

                        const label =
                            buildLabel()
                                .plainText(text)
                                .fontSize(16)
                                .fontWeight(700)
                                .textAlign("CENTER")
                                .fillColor("#111111")
                                .backgroundColor("#ffffff")
                                .backgroundOpacity(0.92)
                                .padding(7)
                                .cornerRadius(10)
                                .position({
                                    x: bounds.center.x,
                                    y: bounds.min.y - 28
                                })
                                .layer("ATTACHMENT")
                                .attachedTo(token.id)
                                .locked(true)
                                .disableHit(true)
                                .metadata({
                                    [TOKEN_HUD_METADATA_KEY]: {
                                        characterId: character.id,
                                        ownerId: OBR.player.id,
                                        roomId,
                                        tokenId: token.id,
                                        kind: "vitals-label"
                                    }
                                })
                                .build();

                        await OBR.scene.items.addItems(
                            [label]
                        );

                        return label;
                    }

                    async function removeCharacterHudItems(character, link = null) {
                        const found =
                            await findCharacterHudItems(
                                character.id
                            );

                        const ids =
                            new Set(
                                found.map(
                                    item => item.id
                                )
                            );

                        getHudItemIdsFromLink(link)
                            .forEach(
                                id => ids.add(id)
                            );

                        if (ids.size) {
                            await OBR.scene.items.deleteItems(
                                Array.from(ids)
                            );
                        }
                    }

                    async function updateCharacterTokenDisplay(character, vitalsOverride = null) {
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

                        if (!link?.tokenId) {
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
                            token.layer !== "CHARACTER"
                        ) {
                            return false;
                        }

                        const vitals =
                            vitalsOverride
                                ? normalizeVitals(vitalsOverride)
                                : getVitalsFromCharacterRecord(character);

                        const text =
                            makeTokenHudText(
                                vitals
                            );

                        let labels = [];

                        if (
                            Array.isArray(link.hudItemIds) &&
                            link.hudItemIds.length
                        ) {
                            labels =
                                await OBR.scene.items.getItems(
                                    link.hudItemIds
                                );
                        }

                        if (
                            !labels.length &&
                            link.labelId
                        ) {
                            labels =
                                await OBR.scene.items.getItems(
                                    [link.labelId]
                                );
                        }

                        if (!labels.length) {
                            labels =
                                await findCharacterHudItems(
                                    character.id
                                );
                        }

                        const label =
                            labels.find(
                                item => item.type === "LABEL"
                            );

                        if (label) {
                            await OBR.scene.items.updateItems(
                                [label.id],
                                items => {
                                    for (const item of items) {
                                        if (item.text) {
                                            item.text.plainText =
                                                text;
                                        }
                                    }
                                }
                            );

                            return true;
                        }

                        await removeCharacterHudItems(
                            sourceCharacter,
                            link
                        );

                        const created =
                            await createCharacterHudLabel(
                                sourceCharacter,
                                token,
                                vitals
                            );

                        const latest =
                            await window.RPGCharacterStore
                                ?.getCharacterById(
                                    character.id
                                );

                        if (latest) {
                            await window.RPGCharacterStore.putCharacter({
                                ...latest,
                                owlbearTokenLinks: {
                                    ...(latest.owlbearTokenLinks || {}),
                                    [roomId]: {
                                        tokenId: token.id,
                                        hudItemIds: [created.id],
                                        labelId: created.id,
                                        linkedAt: Date.now()
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

                        const label =
                            await createCharacterHudLabel(
                                latest,
                                token
                            );

                        const updated = {
                            ...latest,
                            owlbearTokenLinks: {
                                ...(latest.owlbearTokenLinks || {}),
                                [roomId]: {
                                    tokenId: token.id,
                                    hudItemIds: [label.id],
                                    labelId: label.id,
                                    linkedAt: Date.now()
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
                        characterId
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
                                        OBR.player.id &&
                                    meta?.roomId ===
                                        roomId
                                );

                            }
                        );

                    }


                    async function removeCharacterConditionOverlays(
                        character
                    ) {

                        const items =
                            await findCharacterConditionOverlayItems(
                                character.id
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
                        condition
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
                                2.35
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
                                bounds.center.y
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
                        conditionOverride = null
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
                            sourceCharacter
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
                                    condition
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


                        if (
                            currentIndex <
                            0
                        ) {

                            return false;

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

                        else {

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
                                OBR.player.id
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

                        const metadata =
                            await OBR.player.getMetadata();


                        return cleanSharedCharacters(
                            metadata[
                                SHARED_CHARACTERS_KEY
                            ]
                        )
                            .filter(
                                character =>
                                    character.roomId ===
                                    roomId
                            );

                    }


                    async function toggleCharacterShare(
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


                        const currentIndex =
                            allShared.findIndex(
                                shared =>
                                    shared.characterId ===
                                    character.id &&
                                    shared.roomId ===
                                    roomId
                            );


                        if (
                            currentIndex >=
                            0
                        ) {

                            allShared.splice(
                                currentIndex,
                                1
                            );

                        }

                        else {

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
                                campaign:
                                    character.campaign ||
                                    "",
                                ownerName:
                                    playerName ||
                                    "Player",
                                roomId,
                                updatedAt:
                                    Date.now()
                            });


                            await clearPartyCharacterRemoval(
                                OBR.player.id,
                                character.id
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


                        return currentIndex <
                            0;

                    }


                    async function getPartySharedCharacters() {

                        const [
                            myMetadata,
                            partyPlayers,
                            roomMetadata
                        ] =
                            await Promise.all([
                                OBR.player.getMetadata(),
                                OBR.party.getPlayers(),
                                OBR.room.getMetadata()
                            ]);


                        const removed =
                            new Set(
                                cleanRemovedPartyCharacters(
                                    roomMetadata[
                                        REMOVED_PARTY_CHARACTERS_KEY
                                    ]
                                )
                            );


                        const sources = [
                            {
                                id:
                                    OBR.player.id,
                                role:
                                    playerRole,
                                metadata:
                                    myMetadata,
                                fallbackName:
                                    playerName ||
                                    "Player"
                            },
                            ...partyPlayers.map(
                                player => ({
                                    id:
                                        player.id,
                                    role:
                                        player.role,
                                    metadata:
                                        player.metadata ||
                                        {},
                                    fallbackName:
                                        "Player"
                                })
                            )
                        ];


                        const unique =
                            new Map();


                        sources.forEach(
                            source => {

                                cleanSharedCharacters(
                                    source.metadata[
                                        SHARED_CHARACTERS_KEY
                                    ]
                                )
                                    .filter(
                                        character =>
                                            character.roomId ===
                                            roomId
                                    )
                                    .forEach(
                                        character => {

                                            const key =
                                                partyCharacterKey(
                                                    source.id,
                                                    character.characterId
                                                );


                                            if (
                                                removed.has(
                                                    key
                                                )
                                            ) {

                                                return;

                                            }


                                            unique.set(
                                                key,
                                                {
                                                    ...character,
                                                    ownerId:
                                                        source.id,
                                                    ownerName:
                                                        character.ownerName ||
                                                        source.fallbackName,
                                                    ownerRole:
                                                        source.role
                                                }
                                            );

                                        }
                                    );

                            }
                        );


                        return Array.from(
                            unique.values()
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
                        updateCharacterConditionOverlays
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
