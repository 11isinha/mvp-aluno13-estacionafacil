# 🚗 EstacionaFácil — MVP Mobile (Android / Web)

Aplicação mobile híbrida desenvolvida para sinalização colaborativa e em tempo real de vagas de estacionamento disponíveis nas proximidades de instituições de ensino e centros urbanos. O projeto utiliza **React + Vite** com **Tailwind CSS**, empacotamento nativo via **Capacitor (Android)**, integração de hardware com **Geolocation** e persistência em nuvem com **Supabase (PostgreSQL + Auth + RLS)**, contando com pipeline automatizado de build via **GitHub Actions**.

---

## 📱 Funcionalidades Principais

* **Autenticação de Usuários (Supabase Auth):** Cadastro e login via e-mail e senha com persistência automática de sessão no dispositivo móvel.
* **Feed em Tempo Real (Read):** Listagem dinâmica das vagas sinalizadas recentemente, exibindo ponto de referência, categoria da vaga (Rápida, Comum, Preferencial/Idoso, Carga/Descarga), coordenadas geográficas e horário da publicação.
* **Sinalização de Vagas com GPS Nativo (Create):** Captura de latitude e longitude diretamente do sensor de localização do dispositivo via `@capacitor/geolocation` e registro no banco de dados.
* **Rota Direta no Mapa:** Integração externa com o Google Maps para traçar a rota imediata até a coordenada exata da vaga sinalizada.
* **Baixa de Vaga Ocupada (Delete):** Controle de autoria que permite ao próprio usuário remover a sinalização assim que a vaga for ocupada.
* **Interface Mobile-First:** Layout responsivo otimizado para uso com uma mão (*thumb-zone*), com barra de navegação inferior fixa e botão de ação flutuante central.

---

## 🛠️ Arquitetura e Tecnologias

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Interface reativa, componentização e empacotamento otimizado |
| **Estilização** | Tailwind CSS v4 | Design system responsivo, tokens de cor e layout mobile-first |
| **Ícones** | Lucide React | Ícones vetoriais leves e consistentes |
| **Runtime Nativo** | Capacitor 7 (Android) | Acesso às APIs nativas do dispositivo e geração do pacote `.apk` |
| **Sensor de Hardware** | `@capacitor/geolocation` | Solicitação de permissão em tempo de execução e leitura de coordenadas GPS |
| **Backend & Banco** | Supabase (PostgreSQL) | Autenticação, API REST automática e políticas de segurança (RLS) |
| **CI/CD** | GitHub Actions | Compilação automatizada do projeto web e build do APK Android via Gradle |

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

O projeto utiliza a tabela `public.vagas_livres` protegida por **Row Level Security (RLS)**. Para reproduzir o ambiente, execute o script abaixo no **SQL Editor** do Supabase:

```sql
create table if not exists public.vagas_livres (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  autor_email text not null,
  referencia text not null,
  tipo_vaga text not null default 'Vaga Comum',
  latitude double precision not null,
  longitude double precision not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

grant usage on schema public to anon, authenticated;
grant all on table public.vagas_livres to authenticated;

alter table public.vagas_livres enable row level security;

create policy "Leitura pública para autenticados"
  on public.vagas_livres for select
  to authenticated
  using (true);

create policy "Inserção pelo próprio usuário"
  on public.vagas_livres for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Exclusão pelo autor"
  on public.vagas_livres for delete
  to authenticated
  using (auth.uid() = user_id);
