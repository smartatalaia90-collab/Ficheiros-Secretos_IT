import random

def gerar_crenca_aleatoria():
    valores = [random.random() for _ in range(3)]
    soma = sum(valores)
    return {
        "A": valores[0] / soma,
        "B": valores[1] / soma,
        "C": valores[2] / soma
    }

def gerar_sensor_dinamico():
    return {
        "A": random.uniform(0.0, 1.0),
        "B": random.uniform(0.0, 1.0),
        "C": random.uniform(0.0, 1.0)
    }

while True:
    print("\n==============================")
    print(" Nova iteração")
    print("==============================")
    
    # 🔹 Crença inicial dinâmica
    belief = gerar_crenca_aleatoria()
    
    print("\nCrença inicial (aleatória):")
    for s, p in belief.items():
        print(f"{s}: {p:.3f}")
    
    # 🔹 Modelo de observação dinâmico
    sensor_model = gerar_sensor_dinamico()
    
    print("\nModelo de observação dinâmico P(o|s):")
    for s, p in sensor_model.items():
        print(f"{s}: {p:.3f}")
    
    # 🔹 Atualização Bayesiana
    updated = {s: belief[s] * sensor_model[s] for s in belief}
    total = sum(updated.values())
    
    if total == 0:
        print("\n⚠️ Erro: total = 0, ignorando iteração...")
        continue
    
    updated = {s: updated[s] / total for s in updated}
    
    # 🔹 Resultado final
    print("\nCrença atualizada:")
    for s, p in updated.items():
        print(f"{s}: {p:.3f}")
    
    # 🔁 Continuar?
    