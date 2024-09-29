import React from 'react';
import { ProgressBar } from 'react-bootstrap';


interface CustomProgressBarProps {
    progress: number;
}


export const CustomProgressBar: React.FC<CustomProgressBarProps> = ({ progress }) => {
    return (
        <ProgressBar
            now={progress}
            aria-label="upload-status"
            max={100}
        />
    );
};