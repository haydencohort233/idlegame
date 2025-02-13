import usePlayerStore from "../store/usePlayerStore";
import items from "../data/items.json";

function Equipment() {
    const { equipped, unequipItem } = usePlayerStore();

    return (
        <div>
            <h2>Equipment</h2>
            <p>
                Weapon: {equipped.weapon ? (
                    <>
                        <img 
                            src={items[equipped.weapon.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.weapon.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("weapon")}>{equipped.weapon.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Shield: {equipped.shield ? (
                    <>
                        <img 
                            src={items[equipped.shield.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.shield.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("shield")}>{equipped.shield.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Head: {equipped.head ? (
                    <>
                        <img 
                            src={items[equipped.head.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.head.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("head")}>{equipped.head.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Neck: {equipped.neck ? (
                    <>
                        <img 
                            src={items[equipped.neck.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.neck.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("neck")}>{equipped.neck.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Back: {equipped.back ? (
                    <>
                        <img 
                            src={items[equipped.back.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.back.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("back")}>{equipped.back.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Chest: {equipped.chest ? (
                    <>
                        <img 
                            src={items[equipped.chest.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.chest.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("chest")}>{equipped.chest.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Legs: {equipped.legs ? (
                    <>
                        <img 
                            src={items[equipped.legs.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.legs.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("legs")}>{equipped.legs.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Feet: {equipped.feet ? (
                    <>
                        <img 
                            src={items[equipped.feet.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.feet.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("feet")}>{equipped.feet.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Hands: {equipped.hands ? (
                    <>
                        <img 
                            src={items[equipped.hands.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.hands.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("hands")}>{equipped.hands.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
            <p>
                Ring: {equipped.ring ? (
                    <>
                        <img 
                            src={items[equipped.ring.id]?.image || "/assets/images/items/fallback.png"} 
                            alt={equipped.ring.name} 
                            width={32} height={32}
                        />
                        <button onClick={() => unequipItem("ring")}>{equipped.ring.name} (Unequip)</button>
                    </>
                ) : "None"}
            </p>
        </div>
    );
}

export default Equipment;
