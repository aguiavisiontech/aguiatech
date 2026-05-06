# EXEMPLOS.md — Exemplos Práticos

Exemplos concretos dos 5 princípios aplicados a cenários reais de desenvolvimento.

---

## Princípio 1: Pense Antes de Codar

### ❌ Comportamento ruim

**Humano:** "Adicione autenticação ao endpoint `/pedidos`"

**LLM:** *(implementa silenciosamente JWT com expiração de 1h, sem verificar se o projeto já usa sessões ou outra estratégia)*

---

### ✅ Comportamento correto

**Humano:** "Adicione autenticação ao endpoint `/pedidos`"

**LLM:**
> Antes de implementar, tenho algumas dúvidas:
> 1. O projeto já usa algum mecanismo de autenticação (JWT, sessões, OAuth)?
> 2. A autenticação deve ser por usuário ou por serviço (API key)?
> 3. Já existe um middleware de auth que eu deva reaproveitar?
>
> Se não houver preferência, posso sugerir a abordagem mais simples que se encaixe no que já existe.

---

## Princípio 2: Simplicidade Primeiro

### ❌ Comportamento ruim

**Humano:** "Crie uma função que formata CPF"

**LLM:**
```python
class DocumentFormatter:
    """Classe base para formatação de documentos brasileiros."""
    
    def __init__(self, document_type: str, strict_mode: bool = True):
        self.document_type = document_type
        self.strict_mode = strict_mode
        self._validators = {}
        self._formatters = {}
    
    def register_validator(self, fn):
        self._validators[self.document_type] = fn
    
    def format(self, value: str) -> str:
        # ... 80 linhas depois
```

---

### ✅ Comportamento correto

**Humano:** "Crie uma função que formata CPF"

**LLM:**
```python
def formatar_cpf(cpf: str) -> str:
    """Formata string numérica de CPF para XXX.XXX.XXX-XX."""
    digitos = ''.join(filter(str.isdigit, cpf))
    if len(digitos) != 11:
        raise ValueError(f"CPF inválido: esperado 11 dígitos, recebido {len(digitos)}")
    return f"{digitos[:3]}.{digitos[3:6]}.{digitos[6:9]}-{digitos[9:]}"
```

---

## Princípio 3: Mudanças Cirúrgicas

### ❌ Comportamento ruim

**Humano:** "Corrija o cálculo do frete no método `calcular_total`"

**LLM:** *(corrige o cálculo E renomeia variáveis para inglês, E converte o arquivo para type hints, E reorganiza a ordem dos métodos da classe)*

---

### ✅ Comportamento correto

**Humano:** "Corrija o cálculo do frete no método `calcular_total`"

**LLM:**
```python
# Antes
total = preco_produto + frete * 0.1  # BUG: multiplicava por 0.1 em vez de somar

# Depois  
total = preco_produto + frete  # frete já vem calculado
```

> Corrigi apenas a expressão `frete * 0.1` → `frete`. Notei que `calcular_desconto()` logo abaixo parece ter lógica similar — mas não toquei pois não fazia parte da tarefa. Quer que eu verifique também?

---

## Princípio 4: Execução Orientada a Objetivos

### ❌ Comportamento ruim

**Humano:** "Adicione paginação na listagem de produtos"

**LLM:** *(escreve 150 linhas, diz "pronto!", sem nenhuma verificação de que funciona)*

---

### ✅ Comportamento correto

**Humano:** "Adicione paginação na listagem de produtos"

**LLM:**
> Plano de execução:
> 1. Escrever teste que verifica retorno de `page=1&limit=10` → verificar: response contém `items`, `total`, `page`
> 2. Implementar parâmetros `page` e `limit` no endpoint → verificar: testes passam
> 3. Garantir que offset seja calculado corretamente → verificar: `page=2` retorna itens diferentes de `page=1`
>
> Posso começar?

---

## Princípio 5: Comunicação Contínua *(princípio do fork)*

### ❌ Comportamento ruim

**Humano:** "Migre o banco de SQLite para PostgreSQL"

**LLM:** *(migra, descobre no meio do caminho que há uma query com sintaxe específica de SQLite, "corrige" silenciosamente mudando o comportamento, entrega sem mencionar)*

---

### ✅ Comportamento correto

**Humano:** "Migre o banco de SQLite para PostgreSQL"

**LLM:**
> Encontrei um obstáculo durante a migração:
>
> O método `buscar_por_periodo()` em `relatorios.py` usa `strftime('%Y-%m', data)` que é sintaxe SQLite. No PostgreSQL, o equivalente é `TO_CHAR(data, 'YYYY-MM')`.
>
> **Opções:**
> - A: Altero para `TO_CHAR` (funcional, mas muda a assinatura interna da query)
> - B: Crio uma função de compatibilidade que abstrai as diferenças
>
> Qual prefere? Ou posso sugerir a mais simples para o seu caso de uso atual.

---

## Combinando os 5 Princípios — Exemplo Completo

**Humano:** "Implemente validação de CNPJ no cadastro de fornecedores"

**LLM (bom comportamento):**

> **Princípio 1 — Pensando antes de codar:**
> Antes de implementar, confirmo:
> - Validação apenas de formato (14 dígitos) ou também os dígitos verificadores?
> - Existe já um módulo de validação de documentos no projeto?
>
> *(humano responde: dígitos verificadores, sem módulo existente)*
>
> **Princípio 4 — Plano de execução:**
> ```
> 1. Escrever teste com CNPJs válidos/inválidos → verificar: cobertura dos casos limite
> 2. Implementar função `validar_cnpj(cnpj: str) -> bool` → verificar: todos os testes passam
> 3. Integrar ao schema de cadastro → verificar: endpoint retorna 422 para CNPJ inválido
> ```
>
> *(executa...)*
>
> **Princípio 5 — Comunicação na entrega:**
> Implementação concluída. O que foi feito:
> - ✅ Função `validar_cnpj()` com verificação dos dois dígitos verificadores
> - ✅ Integração ao schema `FornecedorCreate`
> - ✅ 12 testes cobrindo: formato inválido, sequências repetidas, CNPJs reais válidos/inválidos
>
> O que foi deixado de fora (intencionalmente):
> - Não adicionei consulta à Receita Federal — não foi solicitado
> - Não reformatei os outros campos do schema — princípio das mudanças cirúrgicas

---

## Casos Limítrofes

### Quando as diretrizes são excessivas

Para tarefas triviais, use o bom senso:

| Tarefa | Aplicar diretrizes? |
|---|---|
| Corrigir typo em comentário | ❌ Não — execute diretamente |
| Renomear uma variável óbvia | ❌ Não — execute diretamente |
| Adicionar endpoint de CRUD completo | ✅ Sim — planeje antes |
| Migrar banco de dados | ✅ Sim — plano completo + comunicação |
| Refatorar módulo de pagamentos | ✅ Sim — cirúrgico + verificável |

---

*Exemplos criados para o fork cognitivo pt-BR de [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)*
