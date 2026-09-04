import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { fmtDatePretty, FUSO_HORARIO } from "@/lib/dates";
import type { DadosRelatorio } from "@/lib/relatorio";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#0f2630" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sub: { fontSize: 10, color: "#4d6b76", marginBottom: 1 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 14, marginBottom: 18 },
  stat: { flex: 1, backgroundColor: "#f3fbfd", borderRadius: 6, padding: 10 },
  statNum: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  statLabel: { fontSize: 8.5, color: "#4d6b76", marginTop: 2 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 6 },
  table: { borderTopWidth: 1, borderTopColor: "#d9eef2" },
  rowHead: {
    flexDirection: "row",
    backgroundColor: "#f3fbfd",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#4d6b76",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eef6f8",
  },
  cData: { width: "14%" },
  cColab: { width: "26%" },
  cTarefa: { width: "40%" },
  cHora: { width: "10%" },
  cFoto: { width: "10%" },
  cTarefaPend: { width: "60%" },
  empty: { padding: 10, color: "#4d6b76", fontStyle: "italic" as const },
});

export function RelatorioDocument({ dados }: { dados: DadosRelatorio }) {
  const total = dados.feitos.length + dados.pendentes.length;
  const pct = total ? Math.round((100 * dados.feitos.length) / total) : 0;
  const geradoEm = new Date().toLocaleString("pt-BR", { timeZone: FUSO_HORARIO });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de Tarefas</Text>
        <Text style={styles.sub}>Checklist das Lojas</Text>
        <Text style={styles.sub}>
          Período: {fmtDatePretty(dados.de)} a {fmtDatePretty(dados.ate)}
        </Text>
        <Text style={styles.sub}>Loja(s): {dados.lojaNomes.join(", ") || "—"}</Text>
        <Text style={styles.sub}>Gerado em {geradoEm}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{dados.feitos.length}</Text>
            <Text style={styles.statLabel}>Tarefas concluídas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{dados.pendentes.length}</Text>
            <Text style={styles.statLabel}>Tarefas pendentes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{pct}%</Text>
            <Text style={styles.statLabel}>Taxa de conclusão</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Concluídas ({dados.feitos.length})</Text>
        <View style={styles.table}>
          <View style={styles.rowHead}>
            <Text style={styles.cData}>Data</Text>
            <Text style={styles.cColab}>Colaborador</Text>
            <Text style={styles.cTarefa}>Tarefa</Text>
            <Text style={styles.cHora}>Hora</Text>
            <Text style={styles.cFoto}>Foto</Text>
          </View>
          {dados.feitos.map((f, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={styles.cData}>{fmtDatePretty(f.data)}</Text>
              <Text style={styles.cColab}>{f.colaboradorNome}</Text>
              <Text style={styles.cTarefa}>{f.tarefaTitulo}</Text>
              <Text style={styles.cHora}>{f.hora}</Text>
              <Text style={styles.cFoto}>{f.comFoto ? "Sim" : "—"}</Text>
            </View>
          ))}
          {dados.feitos.length === 0 && <Text style={styles.empty}>Nenhuma tarefa concluída no período.</Text>}
        </View>

        <Text style={styles.sectionTitle}>Pendências / faltou fazer ({dados.pendentes.length})</Text>
        <View style={styles.table}>
          <View style={styles.rowHead}>
            <Text style={styles.cData}>Data</Text>
            <Text style={styles.cColab}>Colaborador</Text>
            <Text style={styles.cTarefaPend}>Tarefa</Text>
          </View>
          {dados.pendentes.map((p, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={styles.cData}>{fmtDatePretty(p.data)}</Text>
              <Text style={styles.cColab}>{p.colaboradorNome}</Text>
              <Text style={styles.cTarefaPend}>{p.tarefaTitulo}</Text>
            </View>
          ))}
          {dados.pendentes.length === 0 && <Text style={styles.empty}>Nenhuma pendência no período. 🎉</Text>}
        </View>
      </Page>
    </Document>
  );
}
