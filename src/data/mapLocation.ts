export interface MapIncident{
    id: string;
    locationName: string;
    longitude: number;
    latitude: number;
     caseCount: number;
     diseaseType: string;
}

export const philippinesIncidents:  MapIncident[] = [ {
    id: '1',
    locationName: 'Manila (ncr)',
    longitude: 120.842,
    latitude: 14.5995,
    caseCount: 150,
    diseaseType: 'Dengue'
},
  {
    id: "2",
    locationName: "Cebu City",
    longitude: 123.8854,
    latitude: 10.3157,
    caseCount: 85,
    diseaseType: 'Covid'
  }
]