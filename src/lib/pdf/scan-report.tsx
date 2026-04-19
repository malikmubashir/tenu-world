/**
 * Scan-report PDF builder.
 *
 * Renders a multi-page PDF for an inspection scan using @react-pdf/renderer.
 * Identity v1 styled — paper canvas, ink type, emerald accents, brand-red
 * for risk callouts. Inter Tight wordmark + Helvetica body (the
 * react-pdf default; matches the SF Pro fallback chain on screen).
 *
 * Pages:
 *   1. Cover           — wordmark + Disc mark, address, generation date,
 *                        big numbers (deposit, deductions, refundable).
 *   2. Per-room recap  — table: room | confidence | subtotal.
 *   3. Observations    — every observation with code, description,
 *                        confidence, photo indices, deduction amount.
 *   4. Disclaimer      — fixed legal disclaimer + report ID + contact.
 *
 * Server-only. Imported by /api/ai/scan after the scan completes.
 */
import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Rect,
} from "@react-pdf/renderer";
import type { RiskScanOutputV2 } from "@/lib/ai/types/risk-scan";

// Identity v1 palette.
const PAPER = "#F4F1EA";
const INK = "#0B1F3A";
const INK_55 = "rgba(11, 31, 58, 0.55)";
const INK_12 = "rgba(11, 31, 58, 0.12)";
const PAPER_2 = "#EDE8DC";
const EMERALD = "#059669";
const RED = "#8B2E2A";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  wordmark: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.6,
    color: INK,
  },
  rule: {
    height: 1,
    backgroundColor: INK_12,
    marginVertical: 16,
  },
  h1: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  h2: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.2,
    marginBottom: 8,
    marginTop: 16,
  },
  meta: {
    fontSize: 10,
    color: INK_55,
    marginBottom: 4,
  },
  addressBlock: {
    marginBottom: 24,
  },
  numbersGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  numberCard: {
    flex: 1,
    padding: 16,
    backgroundColor: PAPER_2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: INK_12,
  },
  numberLabel: {
    fontSize: 9,
    color: INK_55,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  numberValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.4,
  },
  numberValueAccent: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.4,
    color: EMERALD,
  },
  numberValueRed: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.4,
    color: RED,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: INK,
    fontSize: 9,
    color: INK_55,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: INK_12,
  },
  cellRoom: { flex: 3 },
  cellConfidence: { flex: 2 },
  cellAmount: { flex: 2, textAlign: "right" },
  obsBlock: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: PAPER_2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: INK_12,
  },
  obsHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  obsCode: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  obsAmount: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  obsDesc: {
    fontSize: 10,
    color: INK,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  obsMeta: {
    fontSize: 8,
    color: INK_55,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roomTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 8,
    color: INK,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: INK_55,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  disclaimerBlock: {
    marginTop: 24,
    padding: 16,
    backgroundColor: PAPER_2,
    borderLeftWidth: 3,
    borderColor: RED,
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 9,
    color: INK,
    lineHeight: 1.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
  absent: "Absente",
};

function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

interface ScanReportProps {
  inspectionId: string;
  address: string;
  generatedAt: string;
  scan: RiskScanOutputV2;
}

/**
 * Tenu Disc mark, vector, no font dependency. 28×28 default.
 *
 * @react-pdf/renderer's SVG primitives don't support <mask>, so we
 * draw the figure as paper-coloured shapes layered on top of the
 * navy disc. Visually identical to the masked version used elsewhere.
 */
function DiscMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={22} fill={INK} />
      <Circle cx={24} cy={13} r={4.9} fill={PAPER} />
      <Rect x={11} y={22.4} width={26} height={2.2} rx={1.1} fill={PAPER} />
      <Rect x={22.9} y={23.5} width={2.2} height={18} rx={1.1} fill={PAPER} />
    </Svg>
  );
}

function FooterBlock({ inspectionId }: { inspectionId: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Tenu — Rapport de constat • Réf. {inspectionId.slice(0, 8)}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

export function ScanReportPdf({
  inspectionId,
  address,
  generatedAt,
  scan,
}: ScanReportProps) {
  return (
    <Document
      title={`Tenu — ${address}`}
      author="Tenu.World"
      subject="Rapport de constat locatif"
      language="fr-FR"
    >
      {/* Cover */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <DiscMark size={32} />
          <Text style={styles.wordmark}>tenu</Text>
        </View>

        <Text style={styles.h1}>Rapport de constat</Text>
        <View style={styles.addressBlock}>
          <Text style={styles.meta}>Adresse</Text>
          <Text>{address}</Text>
          <Text style={[styles.meta, { marginTop: 8 }]}>Généré le</Text>
          <Text>{formatDate(generatedAt)}</Text>
          <Text style={[styles.meta, { marginTop: 8 }]}>Référence</Text>
          <Text>{inspectionId}</Text>
        </View>

        <View style={styles.rule} />

        <Text style={styles.h2}>Résumé</Text>
        <View style={styles.numbersGrid}>
          <View style={styles.numberCard}>
            <Text style={styles.numberLabel}>Dépôt initial</Text>
            <Text style={styles.numberValue}>
              {formatEur(scan.deposit_amount_eur)}
            </Text>
          </View>
          <View style={styles.numberCard}>
            <Text style={styles.numberLabel}>Retenues estimées</Text>
            <Text style={styles.numberValueRed}>
              {formatEur(scan.total_deduction_eur)}
            </Text>
          </View>
          <View style={styles.numberCard}>
            <Text style={styles.numberLabel}>Solde restituable</Text>
            <Text style={styles.numberValueAccent}>
              {formatEur(scan.refundable_eur)}
            </Text>
          </View>
        </View>

        <Text style={styles.h2}>Pièces inspectées</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellRoom}>Pièce</Text>
            <Text style={styles.cellConfidence}>Confiance</Text>
            <Text style={styles.cellAmount}>Sous-total</Text>
          </View>
          {scan.rooms.map((room) => (
            <View key={room.id} style={styles.tableRow}>
              <Text style={styles.cellRoom}>{room.name}</Text>
              <Text style={styles.cellConfidence}>
                {CONFIDENCE_LABEL[room.confidence] ?? room.confidence}
              </Text>
              <Text style={styles.cellAmount}>
                {formatEur(room.subtotal_eur)}
              </Text>
            </View>
          ))}
        </View>

        <FooterBlock inspectionId={inspectionId} />
      </Page>

      {/* Detailed observations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <DiscMark size={20} />
          <Text style={[styles.wordmark, { fontSize: 14 }]}>tenu</Text>
        </View>
        <Text style={styles.h1}>Observations détaillées</Text>
        <Text style={styles.meta}>
          Chaque observation référence les photos correspondantes par leur
          ordre dans la pièce. Les montants sont indicatifs et fondés sur la
          grille standard du marché à la date du constat.
        </Text>

        {scan.rooms.map((room) => (
          <View key={room.id} wrap={false}>
            <Text style={styles.roomTitle}>{room.name}</Text>
            {room.observations.length === 0 ? (
              <Text style={styles.meta}>
                Aucune observation chiffrée pour cette pièce.
              </Text>
            ) : (
              room.observations.map((obs, i) => (
                <View key={i} style={styles.obsBlock} wrap={false}>
                  <View style={styles.obsHeadRow}>
                    <Text style={styles.obsCode}>
                      {obs.code === "AUTRE"
                        ? `AUTRE — ${obs.element_libre ?? ""}`
                        : obs.code}
                    </Text>
                    <Text style={styles.obsAmount}>
                      {formatEur(obs.deduction_deposit_eur)}
                    </Text>
                  </View>
                  <Text style={styles.obsDesc}>{obs.description}</Text>
                  <Text style={styles.obsMeta}>
                    Confiance: {CONFIDENCE_LABEL[obs.confidence] ?? obs.confidence}
                    {obs.photo_indices.length > 0
                      ? ` • Photos: ${obs.photo_indices
                          .map((n) => `#${n + 1}`)
                          .join(", ")}`
                      : ""}
                    {" • Coût remise en état: "}
                    {formatEur(obs.cout_remise_en_etat_eur)}
                    {" • Coefficient résiduel: "}
                    {(obs.coefficient_residuel * 100).toFixed(0)}%
                  </Text>
                </View>
              ))
            )}
          </View>
        ))}

        <View style={styles.disclaimerBlock} wrap={false}>
          <Text style={styles.disclaimerText}>
            Ce rapport est une estimation indicative produite par le service
            Tenu, fondée sur l&apos;analyse des photographies fournies. Il ne
            constitue ni un avis juridique, ni un état des lieux contradictoire
            au sens des articles 1730 et suivants du Code civil. La validité
            d&apos;une retenue sur dépôt de garantie relève en dernier ressort
            du contrat de bail signé par les parties et de la jurisprudence
            applicable. En cas de désaccord, consultez un professionnel du
            droit immobilier ou saisissez la commission départementale de
            conciliation compétente.
          </Text>
        </View>

        <FooterBlock inspectionId={inspectionId} />
      </Page>
    </Document>
  );
}
