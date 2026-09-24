const SHARED_CHARACTERS_KEY =
    "com.rpgunleashed.character-sheet/sharedCharacters";


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


async function initializeOwlbear() {

    try {

        const sdkModule =
            await import(
                "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk/+esm"
            );


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
                        playerRole
                    ] =
                        await Promise.all([
                            OBR.player.getName(),
                            OBR.player.getRole()
                        ]);


                    const roomId =
                        OBR.room.id;


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
                            partyPlayers
                        ] =
                            await Promise.all([
                                OBR.player.getMetadata(),
                                OBR.party.getPlayers()
                            ]);


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
                                                source.id +
                                                "::" +
                                                character.characterId;


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


                    window.RPGOwlbear = {
                        ready:
                            true,
                        roomId,
                        playerId:
                            OBR.player.id,
                        playerName,
                        playerRole,
                        getMySharedCharacters,
                        toggleCharacterShare,
                        getPartySharedCharacters
                    };


                    document.body.classList.add(
                        "owlbear-connected"
                    );


                    window.dispatchEvent(
                        new CustomEvent(
                            "rpg-owlbear-ready"
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

}


initializeOwlbear();
