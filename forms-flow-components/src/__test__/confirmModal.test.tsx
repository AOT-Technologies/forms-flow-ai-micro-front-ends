import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "../components/CustomComponents/ConfirmModal";

const renderConfirmModal = (props)=> render(<ConfirmModal {...props}/>);
describe("Confirm Modal Component",()=>{
    const mockOnClose = jest.fn();
    const mockPrimaryAction = jest.fn();
    const mockSecondaryAction = jest.fn();
    const defaultProps = {
        show: true,
        onClose:mockOnClose,
        secondaryBtnAction: mockSecondaryAction,
        title:"Confirm",
        message:"Do you want to confirm?",
        messageSecondary: 'are you sure',
        primaryBtnAction: mockPrimaryAction,
        primaryBtnText:"Yes", 
        primaryBtndataTestid: 'confirm-button',
        secondaryBtnText:"No", 
        secondoryBtndataTestid:'cancel-button',  
    }
    it("render confirm modal without breaking",()=>{
        renderConfirmModal(defaultProps);
        expect(screen.getByTestId("confirm-button")).toBeInTheDocument();
        expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    })

    it("triger primary button action",()=>{
        renderConfirmModal(defaultProps);
        fireEvent.click(screen.getByTestId("confirm-button"));
        expect(mockPrimaryAction).toHaveBeenCalled();

    })

    it("triger secondary button action",()=>{
        renderConfirmModal(defaultProps);
        fireEvent.click(screen.getByTestId("cancel-button"));
        expect(mockSecondaryAction).toHaveBeenCalled();

    })

    it("render confirm modal when show false",()=>{
        renderConfirmModal({...defaultProps,show:false});
        expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    })
});

