import Grid from '@mui/material/Grid2';
import Container from '@mui/material/Container';
import { DayedSeances, IDedSeance } from './TimelinePage';
import SeanceCard from './SeanceCard';
import { MovieProps } from '../HomePage/Album';
import { getProfile } from '../localStorage'; 


export type TimelineProps = {
    dayFilterId: number,
    lgFilterId: number,
    seances: DayedSeances[],
    movies: MovieProps[],
    selectedProfile: string,
}

const filters = [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_: IDedSeance) => (true),
    (seance: IDedSeance) => (!seance.seance.dubbed),
    (seance: IDedSeance) => (!seance.seance.subtitled),
]


export default function Timeline(props: TimelineProps) {
    const profile = getProfile(props.selectedProfile);
    const allowedCinemas = profile?.cinemas ?? [];

    if (props.dayFilterId >= props.seances.length || !(props.movies)) {
        return (<></>)
    } else {
        return (
            <Container sx={{ py: 8 }} maxWidth="md">
                <Grid container spacing={1.5} columns={{ xs: 4, sm: 8, md: 8 }}>
                    {props.seances[props.dayFilterId].seances
                        .sort((a, b) => (a.seance.time.localeCompare(b.seance.time)))
                        .filter(filters[props.lgFilterId])
                        .filter(seance => allowedCinemas.length > 0 ? allowedCinemas.includes(seance.seance.cine) : true)
                        .map((seance: IDedSeance) => (
                            <Grid key={seance.seance.time + seance.seance.cine + seance.seance.dubbed + seance.id} size={4}>
                                <SeanceCard seance={seance.seance} movie={props.movies[seance.id]} />
                            </Grid>
                        ))}
                </Grid>
            </Container>
        );
    }
}