import usePlayerStore from "../store/usePlayerStore";

function Actions() {
    const addItem = usePlayerStore((state) => state.addItem);
    const mine = usePlayerStore((state) => state.mine);
    const miningSkill = usePlayerStore((state) => state.skills.mining);

    return (
        <div>
            <h3>Actions</h3>
            <button onClick={() => addItem("bronze_sword")}>Bronze Sword</button>
            <button onClick={() => addItem("bronze_chainbody")}>Bronze Chainbody</button>
            <button onClick={() => addItem("robe_bottom")}>Robe Bottom</button>
            <button onClick={() => addItem("wooden_shield")}>Wooden Shield</button>
            <button onClick={() => addItem("silver_necklace")}>Silver Necklace</button>
            <button onClick={() => addItem("leather_helmet")}>Leather Helmet</button>
            <button onClick={() => addItem("obsidian_cape")}>Obsidian Cape</button>
            <button onClick={() => addItem("leather_gloves")}>Leather Gloves</button>
            <button onClick={() => addItem("leather_boots")}>Leather Boots</button>
            <button onClick={() => addItem("gold_ring")}>Gold Ring</button>
        </div>
    );
}

export default Actions;
