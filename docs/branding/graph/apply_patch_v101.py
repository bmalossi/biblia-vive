"""
apply_patch_v101.py
====================
Aplica as 3 correções do PR_DESCRIPTION.md ao GRAPH_INDEX_v10_unified.json
para produzir a versão v10.1.0.

Correções:
1. RUNTIME-EVT-NOTIFICATIONS.relations: executa -> disparado_por
2. RUNTIME-EVT-NOTIFICATIONS.read_before: remove AI_GUARDRAILS, adiciona COMM-TERMINOLOGY
3. graph_version: 10.0.0 -> 10.1.0

Regras:
- Nenhum outro nó, relação canônica ou tipo é alterado.
- Apenas adição/substituição de campos no nó Notifications.
- Output é JSON indentado com trailing newline.

Uso:
    python apply_patch_v101.py <input.json> <output.json>

Se nenhum argumento for passado, usa os caminhos padrão definidos abaixo.
"""

import json
import copy
import sys

DEFAULT_INPUT = "GRAPH_INDEX_v10_unified.json"
DEFAULT_OUTPUT = "GRAPH_INDEX_v10.1.0.json"


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT
    output_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUTPUT

    # Load
    with open(input_path, encoding="utf-8") as f:
        graph = json.load(f)

    # Snapshot for diff
    before = copy.deepcopy(graph)

    # PATCH 1: relation executa -> disparado_por
    notif = None
    for n in graph["nodes"]:
        if n["id"] == "RUNTIME-EVT-NOTIFICATIONS":
            notif = n
            break

    if notif is None:
        print("[ERROR] RUNTIME-EVT-NOTIFICATIONS not found")
        sys.exit(1)

    patched_relations = False
    for rel in notif["relations"]:
        if rel.get("type") == "executa" and rel.get("target") == "RUNTIME-TOO-PROGRESS":
            rel["type"] = "disparado_por"
            patched_relations = True
            break

    if not patched_relations:
        print("[ERROR] executa->RUNTIME-TOO-PROGRESS relation not found")
        sys.exit(1)

    print("[1/3] PATCH: executa -> disparado_por OK")

    # PATCH 2: read_before swap
    rb = notif.get("read_before", [])
    if "LOGOS-AI-GUARDRAILS" not in rb:
        print("[WARNING] LOGOS-AI-GUARDRAILS not in read_before (already removed?)")
    else:
        rb.remove("LOGOS-AI-GUARDRAILS")
        if "LOGOS-COMM-TERMINOLOGY" not in rb:
            rb.append("LOGOS-COMM-TERMINOLOGY")
        notif["read_before"] = rb
    print("[2/3] PATCH: AI_GUARDRAILS -> COMM-TERMINOLOGY in read_before OK")

    # PATCH 3: version bump
    graph["graph_version"] = "10.1.0"
    graph["title"] = "GRAPH_INDEX_v10.1.0"
    print("[3/3] PATCH: version 10.0.0 -> 10.1.0 OK")

    # VALIDATION: no broken references
    all_ids = set(n["id"] for n in graph["nodes"])
    errors = 0
    for n in graph["nodes"]:
        for rb_id in n.get("read_before", []):
            if rb_id not in all_ids:
                print(f"  BROKEN REF: {n['id']}.read_before -> {rb_id}")
                errors += 1
        for r in n.get("relations", []):
            if r.get("target") not in all_ids:
                print(f"  BROKEN REF: {n['id']}.{r['type']} -> {r['target']}")
                errors += 1

    if errors:
        print(f"[ERROR] {errors} broken references after patch")
        sys.exit(1)

    # VERIFY NO UNINTENDED CHANGES to any other node
    before_by_id = {bn["id"]: bn for bn in before["nodes"]}
    for n in graph["nodes"]:
        if n["id"] != "RUNTIME-EVT-NOTIFICATIONS":
            before_node = before_by_id.get(n["id"])
            if before_node is not None and n != before_node:
                print(f"[ERROR] Unintended change in {n['id']}")
                sys.exit(1)

    print("\n[DONE] All patches applied. Zero broken references. Zero unintended changes.")
    print(f"  Version: {graph['graph_version']}")
    print(f"  Nodes: {len(graph['nodes'])}")
    print(f"  Relationships: {len(graph.get('relationships', []))}")

    # WRITE
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(graph, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nWritten to {output_path}")


if __name__ == "__main__":
    main()
