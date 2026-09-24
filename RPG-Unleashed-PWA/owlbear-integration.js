const SHARED_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/sharedCharacters";


const REMOVED_PARTY_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/removedPartyCharacters";


const LIVE_SHEET_CHANNEL =
    "com.rpgunleashed.character-sheet/liveSheetV1";


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
                        updateRemoteCharacter
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
