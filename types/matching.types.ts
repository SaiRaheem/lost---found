export interface MatchingContext {
    lostItem: any;
    foundItem: any;
}

export interface ScoringResult {
    category_score: number;
    location_score: number;
    tfidf_score: number;
    fuzzy_score: number;
    attribute_score: number;
    date_score: number;
    total_score: number;
}

export interface ExtractedAttributes {
    brands: string[];
    colors: string[];
    models: string[];
}

export interface SynonymMap {
    [key: string]: string[];
}
