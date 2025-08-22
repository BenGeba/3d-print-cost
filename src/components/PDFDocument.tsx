import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image,
  Font
} from '@react-pdf/renderer';
import { AppState } from '../types';
import { formatToCurrency, prettyDuration, number } from '../utils';
import roboto from "../assets/fonts/RobotoMono-Regular.ttf";
import robotoBold from "../assets/fonts/RobotoMono-Bold.ttf";

Font.register({
    family: 'Roboto Mono',
    fonts: [
        {
            src: roboto,
            fontWeight: 'normal',
        },
        {
            src: robotoBold,
            fontWeight: 'bold',
        }
    ],
});

// Nord theme colors for PDF
const nordColors = {
  // Polar Night
  darkest: '#2E3440',
  dark: '#3B4252',
  medium: '#434C5E',
  light: '#4C566A',
  
  // Snow Storm
  lightest: '#ECEFF4',
  lighter: '#E5E9F0',
  normal: '#D8DEE9',
  
  // Frost
  blueLight: '#8FBCBB',
  blue: '#88C0D0',
  blueBright: '#81A1C1',
  blueDeep: '#5E81AC',
  
  // Aurora
  red: '#BF616A',
  orange: '#D08770',
  yellow: '#EBCB8B',
  green: '#A3BE8C',
  purple: '#B48EAD',
};

const AMOUNT_COL_WIDTH = 120;
const PAGE_PADDING = 30;
const HEADER_HEIGHT = 50;
const FOOTER_HEIGHT = 50;

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: nordColors.lightest,
    padding: PAGE_PADDING,
    fontFamily: 'Roboto Mono',
    paddingHorizontal: PAGE_PADDING,
    paddingTop: PAGE_PADDING + HEADER_HEIGHT,
    paddingBottom: PAGE_PADDING + FOOTER_HEIGHT,
  },
  content: {
      paddingTop: 10,
      paddingBottom: FOOTER_HEIGHT + 10
  },
  header: {
      position: 'absolute',
      top: PAGE_PADDING,
      left: PAGE_PADDING,
      right: PAGE_PADDING,
      height: HEADER_HEIGHT,
      justifyContent: 'flex-end',
      borderBottom: `2pt solid ${nordColors.blueDeep}`,
      paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: nordColors.darkest,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: nordColors.medium,
  },
  section: {
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    border: `1pt solid ${nordColors.normal}`,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: nordColors.darkest,
    marginBottom: 10,
    borderBottom: `1pt solid ${nordColors.normal}`,
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
    paddingVertical: 2,
    width: '100%',
  },
  label: {
    fontSize: 10,
    color: nordColors.medium,
    flexGrow: 1,
    paddingRight: 8,
  },
  value: {
    fontSize: 10,
    color: nordColors.darkest,
    fontWeight: 'bold',
    textAlign: 'right',
    width: AMOUNT_COL_WIDTH,
    flexShrink: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTop: `2pt solid ${nordColors.blueDeep}`,
    backgroundColor: nordColors.lighter,
    padding: 8,
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: nordColors.darkest,
    paddingRight: 8,
    flexGrow: 1,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: nordColors.blueDeep,
    textAlign: 'right',
    width: AMOUNT_COL_WIDTH,
    flexShrink: 0,
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    border: `1pt solid ${nordColors.normal}`,
    minHeight: 200, // Ensure minimum height for proper space calculation
  },
  qrTitle: {
    fontSize: 12,
    color: nordColors.medium,
    marginBottom: 10,
  },
  qrCode: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  qrDescription: {
    fontSize: 8,
    color: nordColors.medium,
    textAlign: 'center',
    maxWidth: 200,
  },
  footer: {
      position: 'absolute',
      bottom: PAGE_PADDING,
      left: PAGE_PADDING,
      right: PAGE_PADDING,
      textAlign: 'center',
      fontSize: 8,
      color: nordColors.medium,
      borderTop: `1pt solid ${nordColors.normal}`,
      paddingTop: 10,
  },
  modeIndicator: {
      position: 'absolute',
      top: 8,
      right: 0,
      backgroundColor: nordColors.blueDeep,
      color: 'white',
      padding: 5,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 'bold',
  },
});

interface CalculationData {
  materialCost: number;
  energyCost: number;
  depreciationCost: number;
  maintenanceCost: number;
  laborCost: number;
  preparationCost: number;
  postProcessingCost: number;
  shippingCost: number;
  packagingCost: number;
  margin: number;
  vatAmount: number;
  total: number;
  totalHours: number;
  getFilamentGrams: (filament: any) => number;
}

interface PDFDocumentProps {
  appState: AppState;
  calculations: CalculationData;
  qrCodeDataUrl: string;
}

export const PDFDocument: React.FC<PDFDocumentProps> = ({ 
  appState, 
  calculations, 
  qrCodeDataUrl 
}) => {
  const formatCurrency = (value: number) => formatToCurrency({ 
    num: value, 
    currency: appState.currency,
    decimalPlaces: 2,
    significantDecimalPlaces: 2
  });
  
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Document>
      <Page size="A4" wrap style={styles.page}>
        <View style={styles.content}>
            {/* Print Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Print Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Print Time:</Text>
                    <Text style={styles.value}>{prettyDuration(Math.floor(calculations.totalHours), (calculations.totalHours % 1) * 60)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Average Power:</Text>
                    <Text style={styles.value}>{number(appState.avgPowerW, 0)} W</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Power Profile:</Text>
                    <Text style={styles.value}>{appState.powerProfile}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Support Waste:</Text>
                    <Text style={styles.value}>{number(appState.supportWastePercent, 0)}%</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Failure Rate:</Text>
                    <Text style={styles.value}>{number(appState.failureRatePercent, 0)}%</Text>
                </View>
            </View>

            {/* Filament Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Filament Details</Text>
                {appState.filaments.map((filament, index) => (
                    <View key={filament.id}>
                        <View style={styles.row}>
                            <Text style={styles.label}>{filament.name} ({filament.material}):</Text>
                            <Text style={styles.value}>
                                {calculations.getFilamentGrams(filament).toFixed(1)}g
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Price per kg:</Text>
                            <Text style={styles.value}>{formatCurrency(number(filament.pricePerKg, 0))}</Text>
                        </View>
                        {index < appState.filaments.length - 1 && (
                            <View style={{ marginBottom: 8 }} />
                        )}
                    </View>
                ))}
            </View>

            {/* Cost Breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cost Breakdown</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Material Cost:</Text>
                    <Text style={styles.value}>{formatCurrency(calculations.materialCost)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Energy Cost:</Text>
                    <Text style={styles.value}>{formatCurrency(calculations.energyCost)}</Text>
                </View>
                {appState.mode === 'business' && calculations.depreciationCost > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Printer Depreciation:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.depreciationCost)}</Text>
                    </View>
                )}
                {calculations.maintenanceCost > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Maintenance:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.maintenanceCost)}</Text>
                    </View>
                )}
                {appState.mode === 'business' && calculations.laborCost > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Labor:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.laborCost)}</Text>
                    </View>
                )}
                {appState.mode === 'business' && calculations.preparationCost > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Preparation:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.preparationCost)}</Text>
                    </View>
                )}
                {appState.mode === 'business' && calculations.postProcessingCost > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Post-processing:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.postProcessingCost)}</Text>
                    </View>
                )}
                {appState.mode === 'business' && calculations.shippingCost > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Shipping:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.shippingCost)}</Text>
                    </View>
                )}
                {appState.mode === 'business' && calculations.packagingCost > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Packaging:</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.packagingCost)}</Text>
                    </View>
                )}
                {calculations.margin > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Margin ({number(appState.marginPercent, 0)}%):</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.margin)}</Text>
                    </View>
                )}
                {appState.mode === 'business' && calculations.vatAmount > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>VAT ({number(appState.vatPercent, 0)}%):</Text>
                        <Text style={styles.value}>{formatCurrency(calculations.vatAmount)}</Text>
                    </View>
                )}

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Cost:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(calculations.total)}</Text>
                </View>
            </View>

            {/* QR Code Section - Container with break control */}
            <View wrap={false}>
                <View style={styles.qrSection}>
                    <Text style={styles.qrTitle}>Open Calculation in Browser</Text>
                    <Image style={styles.qrCode} src={qrCodeDataUrl} />
                    <Text style={styles.qrDescription}>
                        Scan this QR code with your smartphone to open this calculation in the 3D Print Cost Calculator web app
                    </Text>
                </View>
            </View>
        </View>

          <View style={styles.header} fixed>
              <Text style={styles.title}>3D Print Cost Calculation</Text>
              <Text style={styles.subtitle}>Generated on {getCurrentDate()}</Text>
              <Text style={styles.modeIndicator}>{appState.mode.toUpperCase()} MODE</Text>
          </View>

        {/* Footer */}
        <Text style={styles.footer} fixed={true}>
          Generated by 3D Print Cost Calculator • Calculation includes all applicable costs and taxes
        </Text>
      </Page>
    </Document>
  );
};