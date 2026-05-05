import {
  ilpConnectorInstances,
  ilpCorridors,
  ilpRepositories,
  type ILPCorridor,
  type ILPConnectorInstance,
  type ILPRepository,
} from '../data/ilpData'
import type { DataSourceMeta } from '../types/dataAccuracy'
import { makeDataSourceMeta } from '../types/dataAccuracy'
import { getAccuracyWarning } from '../types/dataAccuracy'
import { classifyIlpStaticData, classifyIlpStaticDataBesideLiveBridge } from './dataAccuracyClassifier'

export type ILPConnectorWithMeta = ILPConnectorInstance & { dataSource: DataSourceMeta }
export type ILPCorridorWithMeta = ILPCorridor & { dataSource: DataSourceMeta }
export type ILPRepositoryWithMeta = ILPRepository & { dataSource: DataSourceMeta }

const STATIC_ILP_WARNING =
  'Static ILP connector/corridor data is demo/reference data unless verified by a configured endpoint.'

const connectorRecordMeta = (c: ILPConnectorInstance, operatorBridgeAbove: boolean): DataSourceMeta => {
  const base = operatorBridgeAbove ? classifyIlpStaticDataBesideLiveBridge() : classifyIlpStaticData()
  return makeDataSourceMeta({
    ...base,
    sourceName: `Connector record: ${c.name}`,
    sourceUrl: c.url,
    confidencePct: c.url ? 22 : 18,
    warning: operatorBridgeAbove
      ? `Reference row from ilpData.ts. Live settlement metrics: operator bridge above.`
      : `${STATIC_ILP_WARNING} ${getAccuracyWarning('DEMO') ?? ''}`.trim(),
  })
}

const corridorRecordMeta = (c: ILPCorridor): DataSourceMeta => {
  const base = classifyIlpStaticData()
  return makeDataSourceMeta({
    ...base,
    accuracy: 'DERIVED',
    sourceKind: 'derived_model',
    sourceName: `Corridor record: ${c.name}`,
    confidencePct: 25,
    warning: `${STATIC_ILP_WARNING} ${getAccuracyWarning('DERIVED') ?? ''}`.trim(),
  })
}

const repoRecordMeta = (r: ILPRepository): DataSourceMeta =>
  makeDataSourceMeta({
    accuracy: 'PUBLIC_DIRECTORY',
    sourceKind: 'static_dataset',
    sourceName: `Public repo listing: ${r.fullName}`,
    sourceUrl: r.url,
    confidencePct: 70,
    warning: getAccuracyWarning('PUBLIC_DIRECTORY'),
  })

export function getIlpConnectorsWithSourceMeta(operatorBridgeAbove = false): ILPConnectorWithMeta[] {
  return ilpConnectorInstances.map((c) => ({ ...c, dataSource: connectorRecordMeta(c, operatorBridgeAbove) }))
}

export function getIlpCorridorsWithSourceMeta(): ILPCorridorWithMeta[] {
  return ilpCorridors.map((c) => ({ ...c, dataSource: corridorRecordMeta(c) }))
}

export function getIlpReposWithSourceMeta(): ILPRepositoryWithMeta[] {
  return ilpRepositories.map((r) => ({ ...r, dataSource: repoRecordMeta(r) }))
}
