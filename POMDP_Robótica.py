import random
import matplotlib.pyplot as plt
import time

# =========================================================
# 1. DEFINIÇÃO DO AMBIENTE
# =========================================================

states = ["A", "B", "C"]
actions = ["left", "right", "stay"]

# =========================================================
# 2. MODELO DE TRANSIÇÃO
# =========================================================

def transition_model(state, action):
    model = {
        "left": {
            "A": {"A": 0.8, "B": 0.2, "C": 0.0},
            "B": {"A": 0.7, "B": 0.2, "C": 0.1},
            "C": {"A": 0.0, "B": 0.8, "C": 0.2},
        },
        "right": {
            "A": {"A": 0.2, "B": 0.8, "C": 0.0},
            "B": {"A": 0.1, "B": 0.2, "C": 0.7},
            "C": {"A": 0.0, "B": 0.2, "C": 0.8},
        },
        "stay": {
            "A": {"A": 1.0, "B": 0.0, "C": 0.0},
            "B": {"A": 0.0, "B": 1.0, "C": 0.0},
            "C": {"A": 0.0, "B": 0.0, "C": 1.0},
        }
    }
    return model[action][state]

# =========================================================
# 3. MODELO DE OBSERVAÇÃO
# =========================================================

observation_model = {
    "A": {"high": 0.7, "medium": 0.2, "low": 0.1},
    "B": {"high": 0.3, "medium": 0.5, "low": 0.2},
    "C": {"high": 0.1, "medium": 0.3, "low": 0.6},
}

def get_observation(state):
    probs = observation_model[state]
    return random.choices(list(probs.keys()), list(probs.values()))[0]

# =========================================================
# 4. NORMALIZAÇÃO
# =========================================================

def normalize(b):
    total = sum(b.values())
    if total == 0:
        return {s: 1/len(b) for s in b}
    return {s: b[s] / total for s in b}

# =========================================================
# 5. POLÍTICA (ε-greedy)
# =========================================================

def choose_action(belief, epsilon=0.2):
    if random.random() < epsilon:
        return random.choice(actions)

    best_state = max(belief, key=belief.get)

    if best_state == "A":
        return "left"
    elif best_state == "C":
        return "right"
    else:
        return random.choice(["left", "right"])

# =========================================================
# 6. CONFIGURAÇÃO DO GRÁFICO
# =========================================================

plt.ion()
fig, (ax1, ax2) = plt.subplots(2, 1)

# =========================================================
# 7. LOOP GLOBAL
# =========================================================

while True:

    print("\n==============================")
    print(" NOVA EXECUÇÃO DO ROBÔ ")
    print("==============================")

    true_state = random.choice(states)
    belief = {s: 1/3 for s in states}

    history_A, history_B, history_C = [], [], []
    time_history = []

    steps = 20

    for step in range(steps):

        print(f"\nSTEP {step}")
        print("True state:", true_state)
        print("Belief:", belief)

        # -----------------------------
        # MEDIÇÃO DE TEMPO
        # -----------------------------
        start_time = time.time()

        # AÇÃO
        action = choose_action(belief)
        print("Action:", action)

        # TRANSIÇÃO
        trans_probs = transition_model(true_state, action)
        true_state = random.choices(
            list(trans_probs.keys()),
            list(trans_probs.values())
        )[0]

        # OBSERVAÇÃO
        obs = get_observation(true_state)
        print("Observation:", obs)

        # PREDIÇÃO
        predicted = {s: 0.0 for s in states}
        for s in states:
            for s_next in states:
                predicted[s_next] += (
                    transition_model(s, action)[s_next] * belief[s]
                )

        # UPDATE
        updated = {
            s: observation_model[s][obs] * predicted[s]
            for s in states
        }

        # NORMALIZAÇÃO
        belief = normalize(updated)

        # -----------------------------
        # FIM DA MEDIÇÃO
        # -----------------------------
        end_time = time.time()
        processing_time = end_time - start_time
        time_history.append(processing_time)

        # HISTÓRICO
        history_A.append(belief["A"])
        history_B.append(belief["B"])
        history_C.append(belief["C"])

        # -----------------------------
        # ATUALIZAÇÃO DOS GRÁFICOS
        # -----------------------------
        ax1.clear()
        ax1.plot(history_A, label="Sala A")
        ax1.plot(history_B, label="Sala B")
        ax1.plot(history_C, label="Sala C")
        ax1.set_title("Evolução da Crença")
        ax1.set_xlabel("Passos")
        ax1.set_ylabel("Probabilidade")
        ax1.legend()

        ax2.clear()
        ax2.plot(time_history, label="Tempo de processamento")
        ax2.set_title("Tempo de Processamento por Iteração")
        ax2.set_xlabel("Passos")
        ax2.set_ylabel("Tempo (segundos)")
        ax2.legend()

        plt.pause(0.2)

    # RESULTADO FINAL
    print("\n==============================")
    print("FINAL BELIEF:", belief)
    print("FINAL TRUE STATE:", true_state)

    opcao = input("\nENTER para reiniciar ou 'sair': ")
    if opcao.lower() == "sair":
        break

plt.ioff()
plt.show()